const moodSelect = document.getElementById("moodSelect");
const dynamicSection = document.getElementById("dynamicSection");
const form = document.getElementById("moodForm");
const result = document.getElementById("result");

moodSelect.addEventListener("change", handleMoodChange);

function handleMoodChange() {
  dynamicSection.innerHTML = "";
  document.body.className = "";

  const mood = moodSelect.value;
  document.body.classList.add(mood);

  if (mood === "happy") {
    dynamicSection.innerHTML = `
      <label>
        What made you happy today?
        <input type="text" id="extraInput" required />
      </label>
    `;
  }

  if (mood === "stressed") {
    dynamicSection.innerHTML = `
      <label>
        Stress level (1-10):
        <input type="number" id="extraInput" min="1" max="10" required />
      </label>
    `;
  }

  if (mood === "angry") {
    dynamicSection.innerHTML = `
      <label>
        Who annoyed you?
        <input type="text" id="extraInput" required />
      </label>
    `;
  }

  if (mood === "sleepy") {
    dynamicSection.innerHTML = `
      <label>
        Hours of sleep last night:
        <input type="number" id="extraInput" min="0" max="24" required />
      </label>
    `;
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("username").value;
  const mood = moodSelect.value;

  result.innerHTML = `
    <h2>Reality Check</h2>
    <p>${name}, you are feeling <strong>${mood}</strong>.</p>
    <p>Take care of yourself 💙</p>
  `;
});
