import { members } from "./team-data.js";

const pageId = document.body.dataset.pageId;
const member = members.find((item) => item.pageId === pageId);
const feedback = document.getElementById("feedback");

if (!member) {
  feedback.textContent = "成员资料无法读取，请返回制作组页面。";
  feedback.hidden = false;
} else {
  document.title = `制作组 · ${member.name}`;
  document.getElementById("memberMark").textContent = member.shortMark;
  document.getElementById("memberName").textContent = member.name;
  document.getElementById("memberRole").textContent = member.role;
  document.getElementById("memberDescription").textContent = member.description;
}

