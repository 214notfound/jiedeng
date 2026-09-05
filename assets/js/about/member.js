// 成员页：按 data-page-id 渲染对应成员的真实分工和简介。
import { members } from "./team-data.js";

const id = document.body.dataset.pageId;
const member = members.find((item) => item.pageId === id || `member-${item.id}` === id);
const feedback = document.getElementById("feedback");
if (!member) {
  feedback.hidden = false;
  feedback.textContent = "未找到该成员资料。";
} else {
  document.title = `制作组 · ${member.name}`;
  document.getElementById("memberMark").textContent = member.shortMark;
  document.getElementById("memberRole").textContent = `ROLE / ${member.role}`;
  document.getElementById("memberName").textContent = member.name;
  document.getElementById("memberDescription").textContent = member.description;
}
