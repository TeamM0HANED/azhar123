// script.js: معالجة التفاعل وجلب بيانات الطلاب وعرض أوائل المدرسة
const studentCard = document.getElementById("studentCard");
const feedback = document.getElementById("feedback");
const form = document.getElementById("searchForm");
const yearPlaceholder = document.getElementById("currentYear");
const printButton = document.getElementById("printButton");
const printDateField = document.getElementById("printDate");
const nameField = document.getElementById("studentName");
const gradeField = document.getElementById("studentGrade");
const examField = document.getElementById("studentExamNumber");
const totalField = document.getElementById("studentTotal");
const evaluationField = document.getElementById("studentEvaluation");
const statusField = document.getElementById("studentStatus");
const departmentField = document.getElementById("studentDepartment");
const topStudentsGrid = document.getElementById("topStudentsGrid");
const topStudentsFallback = document.getElementById("topStudentsFallback");
const currentDateElement = document.getElementById("currentDate");
const currentTimeElement = document.getElementById("currentTime");

let studentsCache = null;
yearPlaceholder.textContent = new Date().getFullYear();
printButton?.setAttribute("disabled", "disabled");

function updateDateTime() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  currentDateElement.textContent = formattedDate;
  currentTimeElement.textContent = formattedTime;
}

function formatFullDateTime(date = new Date()) {
  const formattedDate = date.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  return `${formattedDate} – ${formattedTime}`;
}

async function fetchStudents() {
  const response = await fetch("students.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("تعذر تحميل بيانات الطلاب.");
  }
  return response.json();
}

async function ensureStudentsLoaded() {
  if (!studentsCache) {
    studentsCache = await fetchStudents();
    renderTopStudents(studentsCache);
  }
  return studentsCache;
}

function extractTotalValue(totalString) {
  if (!totalString) return 0;
  const [score] = totalString.split("/");
  const numericScore = parseFloat(score?.trim());
  return Number.isFinite(numericScore) ? numericScore : 0;
}

function renderTopStudents(students) {
  if (!topStudentsGrid) return;
  topStudentsGrid.innerHTML = "";

  const rankedStudents = Object.entries(students || {})
    .map(([examNumber, data]) => ({
      examNumber,
      ...data,
      numericTotal: extractTotalValue(data.total),
    }))
    .sort((a, b) => b.numericTotal - a.numericTotal)
    .slice(0, 10);

  if (!rankedStudents.length) {
    topStudentsFallback.classList.remove("hidden");
    return;
  }

  topStudentsFallback.classList.add("hidden");

  rankedStudents.forEach((student, index) => {
    const card = document.createElement("article");
    card.className = "top-card";
    card.setAttribute("role", "listitem");
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
      <span class="top-rank">#${index + 1}</span>
      <div class="top-header">
        <h3 class="top-name">${student.name}</h3>
        <span class="top-score">${student.total}</span>
      </div>
      <p class="top-grade">${student.grade}</p>
      <div class="top-meta">
        <span class="top-evaluation">${student.evaluation}</span>
        <span class="top-department">${student.department}</span>
      </div>
    `;

    topStudentsGrid.appendChild(card);
  });
}

function showStudentCard() {
  studentCard.classList.remove("hidden");
  void studentCard.offsetWidth;
  studentCard.classList.add("visible");
}

function displayStudent(student, examNumber) {
  nameField.textContent = student.name;
  gradeField.textContent = student.grade;
  examField.textContent = examNumber;
  totalField.textContent = student.total;
  evaluationField.textContent = student.evaluation;
  statusField.textContent = student.status;
  statusField.classList.toggle("fail", student.status.includes("راسب"));
  departmentField.textContent = student.department;

  printButton?.removeAttribute("disabled");
  printDateField.textContent = formatFullDateTime();

  showStudentCard();
}

function hideStudentCard() {
  if (studentCard.classList.contains("hidden")) return;

  const onTransitionEnd = (event) => {
    if (event.target === studentCard) {
      studentCard.classList.add("hidden");
      studentCard.removeEventListener("transitionend", onTransitionEnd);
    }
  };

  studentCard.addEventListener("transitionend", onTransitionEnd);
  studentCard.classList.remove("visible");

  printButton?.setAttribute("disabled", "disabled");
  if (printDateField) printDateField.textContent = "";
}

function handlePrint() {
  if (studentCard.classList.contains("hidden")) return;
  printDateField.textContent = formatFullDateTime();
  setTimeout(() => window.print(), 120);
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const examNumber = form.examNumber.value.trim();

  if (!examNumber) {
    feedback.textContent = "يرجى إدخال رقم الجلوس.";
    feedback.className = "feedback error";
    hideStudentCard();
    return;
  }

  try {
    const students = await ensureStudentsLoaded();
    const student = students[examNumber];

    if (student) {
      feedback.textContent = "تم العثور على بيانات الطالب.";
      feedback.className = "feedback success";
      displayStudent(student, examNumber);
    } else {
      feedback.textContent = "رقم الجلوس غير موجود.";
      feedback.className = "feedback error";
      hideStudentCard();
    }
  } catch (error) {
    feedback.textContent = error.message;
    feedback.className = "feedback error";
    hideStudentCard();
  }
}

async function initialise() {
  updateDateTime();
  setInterval(updateDateTime, 1000);

  try {
    await ensureStudentsLoaded();
  } catch (error) {
    topStudentsFallback.classList.remove("hidden");
    topStudentsFallback.textContent = error.message;
  }
}

form.addEventListener("submit", handleFormSubmit);
printButton?.addEventListener("click", handlePrint);

initialise();