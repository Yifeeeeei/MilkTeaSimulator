// disable double click
document.addEventListener(
    "dblclick",
    function (event) {
        event.preventDefault();
    },
    { passive: false }
);

// full screen
let html_ele = document.getElementsByTagName("html")[0];
html_ele.requestFullscreen();

// make all ingredients selector disapper

let ingredients_selector_wrapper = document.getElementsByClassName(
    "ingredients_selector_wrapper"
);

let teabase_selector_wrapper = document.getElementsByClassName(
    "teabase_selector_wrapper"
);

let cupstyle_selector_wrapper = document.getElementsByClassName(
    "cupstyle_selector_wrapper"
);

let quote_selector_wrapper = document.getElementsByClassName(
    "quote_selector_wrapper"
);
// console.log(ingredients_selector_wrapper.length);

let class_selector_teabase = document.getElementById("class_selector_teabase");
let class_selector_addings = document.getElementById("class_selector_addings");
let class_selector_cupstyle = document.getElementById(
    "class_selector_cupstyle"
);
let class_selector_quote = document.getElementById("class_selector_quote");

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
    for (let i = 0; i < cupstyle_selector_wrapper.length; i++) {
        cupstyle_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < quote_selector_wrapper.length; i++) {
        quote_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < teabase_selector_wrapper.length; i++) {
        teabase_selector_wrapper[i].removeAttribute("hidden");
    }
    class_selector_addings.classList.remove("selected");
    class_selector_quote.classList.remove("selected");
    class_selector_cupstyle.classList.remove("selected");
    class_selector_teabase.classList.add("selected");
});
class_selector_addings.addEventListener("click", function () {
    if (class_selector_addings.classList.contains("selected")) {
        return;
    }
    for (let i = 0; i < ingredients_selector_wrapper.length; i++) {
        ingredients_selector_wrapper[i].removeAttribute("hidden");
    }
    for (let i = 0; i < cupstyle_selector_wrapper.length; i++) {
        cupstyle_selector_wrapper[i].setAttribute("hidden", "hidden");
    }

    for (let i = 0; i < teabase_selector_wrapper.length; i++) {
        teabase_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < quote_selector_wrapper.length; i++) {
        quote_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    class_selector_addings.classList.add("selected");
    class_selector_cupstyle.classList.remove("selected");
    class_selector_teabase.classList.remove("selected");
    class_selector_quote.classList.remove("selected");
});

class_selector_cupstyle.addEventListener("click", function () {
    if (class_selector_cupstyle.classList.contains("selected")) {
        return;
    }
    for (let i = 0; i < teabase_selector_wrapper.length; i++) {
        teabase_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < ingredients_selector_wrapper.length; i++) {
        ingredients_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < cupstyle_selector_wrapper.length; i++) {
        cupstyle_selector_wrapper[i].removeAttribute("hidden");
    }
    for (let i = 0; i < quote_selector_wrapper.length; i++) {
        quote_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    class_selector_addings.classList.remove("selected");
    class_selector_cupstyle.classList.add("selected");
    class_selector_teabase.classList.remove("selected");
    class_selector_quote.classList.remove("selected");
});

class_selector_quote.addEventListener("click", function () {
    if (class_selector_quote.classList.contains("selected")) {
        return;
    }
    for (let i = 0; i < teabase_selector_wrapper.length; i++) {
        teabase_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < ingredients_selector_wrapper.length; i++) {
        ingredients_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < cupstyle_selector_wrapper.length; i++) {
        cupstyle_selector_wrapper[i].setAttribute("hidden", "hidden");
    }
    for (let i = 0; i < quote_selector_wrapper.length; i++) {
        quote_selector_wrapper[i].removeAttribute("hidden");
    }
    class_selector_addings.classList.remove("selected");
    class_selector_cupstyle.classList.remove("selected");
    class_selector_teabase.classList.remove("selected");
    class_selector_quote.classList.add("selected");
});

class_selector_teabase.click();

// selector wrappers
for (let i = 0; i < teabase_selector_wrapper.length; i++) {
    teabase_selector_wrapper[i].addEventListener("click", function (e) {
        for (let j = 0; j < teabase_selector_wrapper.length; j++) {
            teabase_selector_wrapper[j]
                .getElementsByTagName("input")[0]
                .removeAttribute("checked");
        }

        this.getElementsByTagName("input")[0].setAttribute("checked", true);
    });
}

for (let i = 0; i < cupstyle_selector_wrapper.length; i++) {
    cupstyle_selector_wrapper[i].addEventListener("click", function (e) {
        for (let j = 0; j < cupstyle_selector_wrapper.length; j++) {
            cupstyle_selector_wrapper[j]
                .getElementsByTagName("input")[0]
                .removeAttribute("checked");
        }

        this.getElementsByTagName("input")[0].setAttribute("checked", true);
    });
}

for (let i = 0; i < ingredients_selector_wrapper.length; i++) {
    ingredients_selector_wrapper[i].addEventListener("click", function (e) {
        if (this.getElementsByTagName("input")[0].hasAttribute("checked")) {
            this.getElementsByTagName("input")[0].removeAttribute("checked");
        } else {
            this.getElementsByTagName("input")[0].setAttribute("checked", true);
        }
    });
}

for (let i = 0; i < quote_selector_wrapper.length; i++) {
    quote_selector_wrapper[i].addEventListener("click", function (e) {
        for (let j = 0; j < quote_selector_wrapper.length; j++) {
            quote_selector_wrapper[j]
                .getElementsByTagName("input")[0]
                .removeAttribute("checked");
        }

        this.getElementsByTagName("input")[0].setAttribute("checked", true);
    });
}
