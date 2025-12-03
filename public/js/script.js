(() => {
  "use strict";

  // Form Validation
  const forms = document.querySelectorAll(".needs-validation");
  Array.from(forms).forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    }, false);
  });
})();

// Navbar Active State
const navbarLinks = document.querySelectorAll(".navbar-nav .nav-link");
const currentPath = window.location.pathname;
navbarLinks.forEach((link) => {
  if (link.getAttribute("href") === currentPath) {
    link.classList.add("active");
  } else {
    link.classList.remove("active");
  }
});

// Dropdown
const dropdown = document.getElementById("dropdown");
if (dropdown) {
  const btn = dropdown.querySelector(".dropdown-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      dropdown.classList.toggle("active");
    });
  }
  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
}

// Sort Toggle (Defensive Check)
const sortToggle = document.getElementById("sortToggle");
if (sortToggle) {
  const sortMenu = document.getElementById("sortMenu");
  const sortInput = document.getElementById("sortInput");
  const selected = document.getElementById("selected");

  sortToggle.addEventListener("click", () => {
    if (sortMenu) sortMenu.style.display = sortMenu.style.display === "block" ? "none" : "block";
  });

  document.querySelectorAll(".dpn-menu li").forEach((li) => {
    li.addEventListener("click", () => {
      document.querySelectorAll(".dpn-menu li").forEach((item) => item.classList.remove("active"));
      li.classList.add("active");
      if(selected) selected.innerText = li.innerText.trim();
      if(sortInput) sortInput.value = li.dataset.value;
      if(sortMenu) sortMenu.style.display = "none";
      li.closest("form").submit();
    });
  });

  document.addEventListener("click", (e) => {
    if (sortMenu && !sortToggle.contains(e.target) && !sortMenu.contains(e.target)) {
      sortMenu.style.display = "none";
    }
  });
}

// Toggle Diff Switch (Compare page)
const toggle = document.getElementById("toggleDiff");
if (toggle) {
  const simpleView = document.getElementById("simpleView");
  const diffView = document.getElementById("diffView");

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      if(simpleView) simpleView.style.display = "none";
      if(diffView) diffView.style.display = "block";
    } else {
      if(diffView) diffView.style.display = "none";
      if(simpleView) simpleView.style.display = "block";
    }
  });
}