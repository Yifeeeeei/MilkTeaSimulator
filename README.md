# MilkTeaSimulator

a webpage app for simulate drinking milk tea (or other stuff)

this project is based on the beer simulator project

## references

-   https://codepen.io/EmanuelKuhn/pen/bEXLqV
-   matter.js

## important updates

### v0.0.5

the basic structure of menus are functioning, next step is to optimize the steps to render the whole canvas, if i can let matter.js render the milktea before rendering the addings, the addings can be seen a lot better, and i can use a higher alpha on the milktea color card.

### v0.0.6

i made a small change to the matter.js script, added the "afterBackgroundRender" event, in order to let the milktea get rendered befroe the addings and after the background, so that we can see the addings clearly. i still kept the original matter.js in the repo, now called matter_original.js. Now with the engine fully functional, the rest of work remains to provide more kinds of drinking on the menu.
