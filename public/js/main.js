const form = document.getElementById("studyForm");
const statusDiv = document.getElementById("status");
const output = document.getElementById("output");
const researchDiv = document.getElementById("research");
const summaryDiv = document.getElementById("summary");
const quizBtn = document.getElementById("generateQuizBtn");
quizBtn.classList.remove("hidden");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const topic = document.getElementById("topic").value.trim();
  const model = document.getElementById("model").value;
  if (!topic) return alert("Enter a topic!");

  statusDiv.innerHTML = "⏳ Researching...";
  output.classList.add("hidden");

  // Show quiz button
  const quizBtn = document.getElementById("generateQuizBtn");
  quizBtn.classList.remove("hidden");

  // Attach click
  quizBtn.onclick = async () => {
    quizBtn.innerText = "⏳ Generating quiz...";
    const resQuiz = await fetch(`/api/quiz/${data.id}`);
    const quizData = await resQuiz.json();

    if (!quizData.success) {
      alert("Error generating quiz");
      return;
    }

    quizBtn.innerText = "🎯 Generate Quiz Again";

    document.getElementById("quizOutput").innerHTML = marked.parse(
      quizData.quiz
    );
    document.getElementById("quizOutput").classList.remove("hidden");
  };

  // Show PDF button
const pdfBtn = document.getElementById("exportPdfBtn");
pdfBtn.classList.remove("hidden");

pdfBtn.onclick = () => {
  window.location.href = `/api/pdf/${data.id}`;
};


  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, model }),
  });

  const data = await res.json();

  if (!data.success) {
    statusDiv.innerHTML = "❌ Error: " + data.error;
    return;
  }

  statusDiv.innerHTML = data.steps.join("<br>");
  researchDiv.innerHTML = marked.parse(data.research);
  summaryDiv.innerHTML = marked.parse(data.summary);
  output.classList.remove("hidden");
});
