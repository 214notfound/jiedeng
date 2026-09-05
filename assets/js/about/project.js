// 项目介绍页：读取共享资料并渲染标签。
import { projectData } from "./team-data.js";

document.getElementById("projectTitle").textContent = projectData.title;
document.getElementById("projectSubtitle").textContent = projectData.subtitle;
document.getElementById("projectDescription").textContent = projectData.description;
document.getElementById("projectTags").replaceChildren(...projectData.tags.map((tag) => {
  const element = document.createElement("span");
  element.className = "about-tag";
  element.textContent = tag;
  return element;
}));
