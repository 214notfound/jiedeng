// 本文件只负责根据固定页面 ID 渲染对应成员的静态资料。
import { getMemberById } from "./team-data.js?v=1.3";

const pageId = document.body.dataset.pageId;
const memberId = pageId?.startsWith("member-") ? pageId.slice("member-".length) : "";
const member = getMemberById(memberId);
const feedback = document.getElementById("feedback");

if (!member) {
  feedback.textContent = "成员资料无法读取，请返回制作组页面。";
  feedback.hidden = false;
} else {
  document.title = `制作组 · ${member.displayName}`;
  document.getElementById("memberArchiveNumber").textContent = member.ui.archiveNumber;
  document.getElementById("memberMark").textContent = member.shortMark;
  document.getElementById("memberName").textContent = member.displayName;

  const portrait = document.getElementById("memberPortrait");
  portrait.src = `../../../assets/images/about/members/${member.portraitFile}`;
  portrait.alt = `${member.displayName}的成员头像`;
  portrait.addEventListener("error", () => portrait.remove(), { once: true });

  const optionalText = [
    ["memberRole", member.roleDisplay],
    ["memberTagline", member.oneSentence],
    ["memberBiography", member.bio],
    ["memberQuote", member.quote]
  ];
  optionalText.forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (value) {
      element.textContent = value;
      element.closest("[data-optional-section]")?.removeAttribute("hidden");
    }
  });

  if (member.modules.length > 0) {
    const modules = document.getElementById("memberModules");
    modules.replaceChildren(...member.modules.map((moduleName) => {
      const item = document.createElement("li");
      item.textContent = moduleName;
      return item;
    }));
    modules.closest("[data-optional-section]").hidden = false;
  }

  if (member.profileFacts?.length > 0) {
    const facts = document.getElementById("memberFacts");
    facts.replaceChildren(...member.profileFacts.map((fact) => {
      const item = document.createElement("li");
      item.textContent = fact;
      return item;
    }));
    facts.closest("[data-optional-section]").hidden = false;
  }

  if (member.completedWork.length > 0) {
    const workList = document.getElementById("memberCompletedWork");
    workList.replaceChildren(...member.completedWork.map((work) => {
      const item = document.createElement("li");
      item.textContent = work;
      return item;
    }));
    workList.closest("[data-optional-section]").hidden = false;
  }
}
