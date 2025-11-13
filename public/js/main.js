const form = document.getElementById("studyForm");
    const statusDiv = document.getElementById("status");
    const output = document.getElementById("output");
    const researchDiv = document.getElementById("research");
    const summaryDiv = document.getElementById("summary");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const topic = document.getElementById("topic").value.trim();
      const model = document.getElementById("model").value;
      if (!topic) return alert("Enter a topic!");

      statusDiv.innerHTML = "⏳ Researching...";
      output.classList.add("hidden");

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