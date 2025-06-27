let state = { role: "student", userId: 1 };
let db = JSON.parse(localStorage.getItem("db")) || null;

async function loadDB() {
  if (!db) {
    const res = await fetch("db.json");
    db = await res.json();
    localStorage.setItem("db", JSON.stringify(db));
  }
  switchView();
}

function saveDB() {
  localStorage.setItem("db", JSON.stringify(db));
}

function switchView() {
  document.querySelectorAll(".role-section").forEach(sec => sec.classList.add("hidden"));

  if (!state.role) return;

  document.getElementById(`${state.role}Section`).classList.remove("hidden");

  if (state.role === "student") loadStudent();
  if (state.role === "teacher") loadTeacher();
  if (state.role === "admin") loadAdmin();
}

document.getElementById("roleSwitch").addEventListener("change", e => {
  state.role = e.target.value;
  state.userId = state.role === "teacher" ? 10 : state.role === "admin" ? null : 1;
  switchView();
});

// STUDENT
function loadStudent() {
  const s = db.students.find(st => st.id === state.userId);
  if (!s) return;

  document.getElementById("studentName").value = s.name;
  document.getElementById("studentContact").value = s.contact;
  document.getElementById("studentAddress").value = s.address;

  document.getElementById("attRecords").innerHTML = s.attendance.length
    ? s.attendance.map(d => `<li>${d}</li>`).join("")
    : "<li>No attendance yet.</li>";

  document.getElementById("classSchedule").innerHTML = s.classes.map(cid => {
    const c = db.classes.find(cl => cl.id === cid);
    const t = db.teachers.find(t => t.id === c.teacherId)?.name || "N/A";
    return `<li>${c.name} – ${c.schedule} – Teacher: ${t}</li>`;
  }).join("");

  document.getElementById("profileForm").onsubmit = e => {
    e.preventDefault();
    s.contact = document.getElementById("studentContact").value;
    s.address = document.getElementById("studentAddress").value;
    saveDB();
    alert("Profile updated!");
  };
}

// TEACHER
function loadTeacher() {
  const t = db.teachers.find(t => t.id === state.userId);
  document.getElementById("teacherClasses").innerHTML = t.classes.map(cid => {
    const c = db.classes.find(cl => cl.id === cid);
    return `<li>${c.name} – ${c.schedule} 
      <button onclick="markAttendance(${cid})">Take Attendance</button>
    </li>`;
  }).join("");
  document.getElementById("attendanceSheet").innerHTML = "";
}

function markAttendance(cid) {
  const c = db.classes.find(cl => cl.id === cid);
  const stList = db.students.filter(s => s.classes.includes(cid));
  document.getElementById("attendanceSheet").innerHTML = `
    <h3>Attendance for ${c.name}</h3>
    <ul>` + stList.map(s => `
      <li>${s.name}
        <select id="att-${s.id}">
          <option value="">--</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </li>`).join("") + `</ul>
    <button onclick="submitAttendance(${cid})">Submit Attendance</button>`;
}

function submitAttendance(cid) {
  const stList = db.students.filter(s => s.classes.includes(cid));
  const today = new Date().toISOString().slice(0, 10);
  stList.forEach(s => {
    const val = document.getElementById(`att-${s.id}`).value;
    if (val === "present" && !s.attendance.includes(today)) {
      s.attendance.push(today);
    }
  });
  saveDB();
  alert("Attendance submitted!");
  loadTeacher();
}

// ADMIN
function loadAdmin() {
  document.getElementById("adminStudents").innerHTML = db.students.map(s => `
    <li>${s.name} (${s.contact})</li>
  `).join("");

  document.getElementById("adminTeachers").innerHTML = db.teachers.map(t => `
    <li>${t.name} (${t.contact})</li>
  `).join("");

  document.getElementById("adminClasses").innerHTML = db.classes.map(c => `
    <li>${c.name} – Teacher: ${db.teachers.find(t => t.id === c.teacherId)?.name || "N/A"}</li>
  `).join("");

  document.getElementById("generateReports").onclick = () => {
    const report = {
      students: db.students.length,
      teachers: db.teachers.length,
      attendance: db.students.map(s => ({ name: s.name, days: s.attendance.length }))
    };
    document.getElementById("reportsOutput").innerText = JSON.stringify(report, null, 2);
  };
}

// ADD STUDENT FORM (in Admin Panel)
document.getElementById("addStudentForm").onsubmit = e => {
  e.preventDefault();
  const name = e.target.elements["name"].value;
  const contact = e.target.elements["contact"].value;
  const address = e.target.elements["address"].value;

  const newStudent = {
    id: Date.now(),
    name,
    contact,
    address,
    attendance: [],
    classes: []
  };

  db.students.push(newStudent);
  saveDB();
  if (state.role === "admin") loadAdmin();
  alert("New student added!");
  e.target.reset();
};

// Initial load
loadDB();
document.addEventListener("DOMContentLoaded", () => {
  fetchWeather();
});

async function fetchWeather() {
  const apiKey = "YOUR_API_KEY_HERE";
  const city = "Lagos"; // Or your school’s location
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const temp = data.main.temp;
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;

    const weatherInfo = `
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
      <strong>${city}</strong>: ${temp}°C, ${desc}
    `;

    document.getElementById("weatherInfo").innerHTML = weatherInfo;
  } catch (err) {
    document.getElementById("weatherInfo").textContent = "Failed to load weather.";
    console.error("Weather fetch error:", err);
  }
}



