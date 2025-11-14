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

  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, model }),
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);

    if (!data.success) {
      statusDiv.innerHTML = "❌ Error: " + (data.error || "Unknown error");
      return;
    }

    statusDiv.innerHTML = data.steps.join("<br>");
    researchDiv.innerHTML = marked.parse(data.research);
    summaryDiv.innerHTML = marked.parse(data.summary);
    output.classList.remove("hidden");

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

  } catch (error) {
    console.error("Fetch error:", error);
    statusDiv.innerHTML = "❌ Network error: " + error.message;
  }
});

// For history detail page
document.getElementById("generateQuizHistory").onclick = async () => {
  const btn = document.getElementById("generateQuizHistory");
  btn.innerText = "⏳ Generating quiz...";

  const res = await fetch(`/api/quiz/<%= record._id %>`);
  const data = await res.json();

  btn.innerText = "🎯 Regenerate Quiz";

  document.getElementById("quizBox").innerHTML = marked.parse(data.quiz);
  document.getElementById("quizBox").classList.remove("hidden");
};