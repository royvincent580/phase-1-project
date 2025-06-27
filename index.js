let state = { role: "student", userId: 1 };
let db = JSON.parse(localStorage.getItem("db")) || null;

async function loadDB(){
  const res = await fetch("db.json");
  db = await res.json();
  localStorage.setItem("db", JSON.stringify(db));
  switchView();
}
loadDB();

document.getElementById("roleSwitch").addEventListener("change", e => {
  state.role = e.target.value;
  state.userId = state.role === "teacher" ? 10 : state.role === "admin" ? null : 1;
  switchView();
});
document.getElementById("openModal").onclick = () => modal.classList.remove("hidden");
document.querySelector(".close").onclick = () => modal.classList.add("hidden");
window.onclick = e => { if (e.target === modal) modal.classList.add("hidden"); };

function switchView(){
  document.querySelectorAll(".role-section").forEach(s => s.classList.add("hidden"));
  document.getElementById(state.role + "Section").classList.remove("hidden");
  if(state.role === "student") loadStudent();
  if(state.role === "teacher") loadTeacher();
  if(state.role === "admin") loadAdmin();
}

// STUDENT
function loadStudent(){
  const s = db.students.find(st => st.id === state.userId);
  document.getElementById("studentName").value = s.name;
  document.getElementById("studentContact").value = s.contact;
  document.getElementById("studentAddress").value = s.address;

  document.getElementById("attRecords").innerHTML = s.attendance.map(d => `<li>${d}</li>`).join("");
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
function loadTeacher(){
  const t = db.teachers.find(t => t.id === state.userId);
  document.getElementById("teacherClasses").innerHTML = t.classes.map(cid => {
    const c = db.classes.find(cl => cl.id === cid);
    return `<li>${c.name} – ${c.schedule} <button onclick="markAttendance(${cid})">Take Attendance</button></li>`;
  }).join("");
  document.getElementById("attendanceSheet").innerHTML = "";
}

function markAttendance(cid){
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

function submitAttendance(cid){
  const stList = db.students.filter(s => s.classes.includes(cid));
  stList.forEach(s => {
    const val = document.getElementById(`att-${s.id}`).value;
    if(val === "present") s.attendance.push(new Date().toISOString().slice(0,10));
  });
  saveDB();
  alert("Attendance saved!");
  loadTeacher();
}

// ADMIN
function loadAdmin(){
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

// ADD STUDENT
const modal = document.getElementById("modal");
document.getElementById("addStudentForm").onsubmit = e => {
  e.preventDefault();
  const [name, contact, address, photoInput] = e.target.elements;
  const newStudent = {
    id: Date.now(),
    name: name.value,
    contact: contact.value,
    address: address.value,
    attendance: [],
    classes: [],
    photo: ""
  };
  const file = photoInput.files[0];
  if(file) {
    const fr = new FileReader();
    fr.onload = () => {
      newStudent.photo = fr.result;
      db.students.push(newStudent);
      saveDB();
      modal.classList.add("hidden");
      if(state.role === "admin") loadAdmin();
      alert("New student added!");
    };
    fr.readAsDataURL(file);
  }
};

function saveDB(){
  localStorage.setItem("db", JSON.stringify(db));
}

// Initialize view
switchView();
