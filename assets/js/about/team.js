// 本文件只负责把制作组静态资料渲染到团队介绍页。
import { memberCards, members, teamData } from "./team-data.js?v=1.5";

const list = document.getElementById("memberList");
const orderIndex = new Map(teamData.memberOrder.map((memberId, index) => [memberId, index]));
const orderedMemberCards = [...memberCards].sort((left, right) => {
  const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
  return leftIndex - rightIndex;
});

document.getElementById("teamPageLabel").textContent = teamData.pageLabel;
document.getElementById("teamTitle").textContent = teamData.name;
document.getElementById("teamIntroduction").textContent = teamData.oneSentence;
document.getElementById("teamMemberCount").textContent = String(members.length).padStart(2, "0");

list.replaceChildren(...orderedMemberCards.map((member, index) => {
  const item = document.createElement("li");
  item.className = "member-card";
  item.id = `memberCard-${member.id}`;

  const link = document.createElement("a");
  link.href = `members/${member.id}.html`;
  link.setAttribute("aria-label", `查看${member.name}的成员档案`);

  const portrait = document.createElement("div");
  portrait.className = "member-card__portrait";

  const fallback = document.createElement("span");
  fallback.className = "member-card__fallback";
  fallback.textContent = member.shortMark;
  fallback.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");
  image.src = `../../assets/images/about/members/${member.portraitFile}`;
  image.alt = `${member.name}的成员头像`;
  image.loading = "lazy";
  image.addEventListener("error", () => image.remove(), { once: true });
  portrait.append(fallback, image);

  const body = document.createElement("div");
  body.className = "member-card__body";

  const number = document.createElement("span");
  number.className = "member-card__number";
  number.textContent = String(index + 1).padStart(2, "0");

  const name = document.createElement("strong");
  name.className = "member-card__name";
  name.textContent = member.name;

  body.append(number, name);
  if (member.role) {
    const role = document.createElement("span");
    role.className = "member-role";
    role.textContent = member.role;
    body.append(role);
  }
  if (member.summary) {
    const summary = document.createElement("span");
    summary.className = "member-card__summary";
    summary.textContent = member.summary;
    body.append(summary);
  }

  const action = document.createElement("span");
  action.className = "member-card__action";
  action.textContent = "查看成员档案 →";
  body.append(action);

  link.append(portrait, body);
  item.append(link);
  return item;
}));

document.getElementById("teamMemberNav").replaceChildren(...orderedMemberCards.map((member, index) => {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = `#memberCard-${member.id}`;
  link.textContent = `${String(index + 1).padStart(2, "0")} ${member.name}`;
  item.append(link);
  return item;
}));

const divisionLabels = [
  ["planningAndWriting", "策划与文案"],
  ["development", "程序开发"],
  ["visualAndInteraction", "视觉与交互"],
  ["testingAndIntegration", "测试与整合"]
];
const confirmedDivisions = divisionLabels.filter(([key]) => teamData.divisions[key]);

if (confirmedDivisions.length > 0) {
  const divisionList = document.getElementById("divisionList");
  divisionList.replaceChildren(...confirmedDivisions.map(([key, label], index) => {
    const row = document.createElement("div");
    row.className = "division-item";
    const term = document.createElement("dt");
    term.textContent = `${String(index + 1).padStart(2, "0")} / ${label}`;
    const description = document.createElement("dd");
    description.textContent = teamData.divisions[key];
    row.append(term, description);
    return row;
  }));
  document.getElementById("teamDivisions").hidden = false;
  document.getElementById("teamDivisionNav").hidden = false;
}
