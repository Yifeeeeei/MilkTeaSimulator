// make all ingredients selector disapper

let ingredients_selector_wrapper = document.getElementsByClassName(
    "ingredients_selector_wrapper"
);

let teabase_selector_wrapper = document.getElementsByClassName(
    "teabase_selector_wrapper"
);
// console.log(ingredients_selector_wrapper.length);

let class_selector_teabase = document.getElementById("class_selector_teabase");
let class_selector_addings = document.getElementById("class_selector_addings");

// for (let i = 0; i < ingredients_selector_wrapper.length; i++) {
//     ingredients_selector_wrapper[i].setAttribute("hidden", "hidden");
// }

class_selector_teabase.addEventListener("click", function () {
    if (class_selector_teabase.classList.contains("selected")) {
        return;
    }
    for (let i = 0; i < ingredients_selector_wrapper.length; i++) {
        ingredients_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < teabase_selector_wrapper.length; i++) {
        teabase_selector_wrapper[i].removeAttribute("hidden");
    }
    class_selector_addings.classList.remove("selected");
    class_selector_teabase.classList.add("selected");
});
class_selector_addings.addEventListener("click", function () {
    if (class_selector_addings.classList.contains("selected")) {
        return;
    }
    for (let i = 0; i < ingredients_selector_wrapper.length; i++) {
        ingredients_selector_wrapper[i].removeAttribute("hidden");
    }
    for (let i = 0; i < teabase_selector_wrapper.length; i++) {
        teabase_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    class_selector_addings.classList.add("selected");
    class_selector_teabase.classList.remove("selected");
});

class_selector_teabase.click();
