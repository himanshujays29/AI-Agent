const toggle = document.getElementById("toggleDiff");
  const simpleView = document.getElementById("simpleView");
  const diffView = document.getElementById("diffView");

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      simpleView.style.display = "none";
      diffView.style.display = "block";
    } else {
      diffView.style.display = "none";
      simpleView.style.display = "block";
    }
  });