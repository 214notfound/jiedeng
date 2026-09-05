// 本文件只负责把项目静态资料渲染到项目介绍页。
import { projectData } from "./team-data.js?v=1.3";

document.getElementById("projectTitle").textContent = projectData.title;
document.getElementById("projectSubtitle").textContent = projectData.subtitle;
document.getElementById("projectDescription").textContent = projectData.cardSummary || projectData.oneSentence;
document.getElementById("projectTags").replaceChildren(...projectData.tags.map((tag) => {
  const element = document.createElement("span");
  element.className = "about-tag";
  element.textContent = tag;
  return element;
}));

const createTextListItems = (items) => items.map((text) => {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
});

document.getElementById("projectStory").replaceChildren(...projectData.storyBackground.map((paragraph) => {
  const element = document.createElement("p");
  element.textContent = paragraph;
  return element;
}));

document.getElementById("legendTitle").textContent = projectData.legend.title;
document.getElementById("legendDescription").textContent = projectData.legend.description;
document.getElementById("legendRules").replaceChildren(...createTextListItems(projectData.legend.rules));

const createFeatureCards = (items) => items.map((feature, index) => {
  const article = document.createElement("article");
  article.className = "project-feature";
  const number = document.createElement("span");
  number.textContent = String(index + 1).padStart(2, "0");
  const title = document.createElement("h3");
  title.textContent = feature.title;
  const description = document.createElement("p");
  description.textContent = feature.description;
  article.append(number, title, description);
  return article;
});

document.getElementById("projectGameplay").replaceChildren(...createFeatureCards(projectData.coreGameplay));
document.getElementById("projectFeatures").replaceChildren(...createFeatureCards(projectData.features));
document.getElementById("projectFlow").replaceChildren(...createTextListItems(projectData.playerFlow));
document.getElementById("versionTitle").textContent = projectData.version.label;
document.getElementById("projectCompleted").replaceChildren(...createTextListItems(projectData.version.completed));
document.getElementById("projectInProgress").replaceChildren(...createTextListItems(projectData.version.inProgress));

const infoLabels = [
  ["projectType", "项目类型"],
  ["technology", "开发技术"],
  ["targetPlatform", "目标平台"],
  ["estimatedPlayTime", "预计时长"],
  ["currentVersion", "当前版本"],
  ["completionDate", "完成时间"]
];
const confirmedInfo = infoLabels.filter(([key]) => {
  const value = projectData.info[key];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
});
document.getElementById("projectInfo").replaceChildren(...confirmedInfo.map(([key, label]) => {
  const row = document.createElement("div");
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  const value = projectData.info[key];
  description.textContent = Array.isArray(value) ? value.join(" / ") : value;
  row.append(term, description);
  return row;
}));
document.getElementById("projectPrivacy").textContent = projectData.privacyNotice;
