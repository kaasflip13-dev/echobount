alert("JAVASCRIPT WERKT!");

const knop = document.getElementById("testKnop");

if (knop) {
    knop.addEventListener("click", function () {
        alert("DE KNOP WERKT!");
    });
} else {
    alert("KNOP NIET GEVONDEN!");
}
