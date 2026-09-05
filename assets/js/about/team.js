import { members } from "./team-data.js";

const list = document.getElementById("memberList");
list.replaceChildren(...members.map((member) => {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = `members/${member.id}.html`;
  const name = document.createElement("strong");
  name.textContent = member.name;
  const role = document.createElement("span");
  role.className = "member-role";
  role.textContent = member.role;
  link.append(name, role);
  item.append(link);
  return item;
}));

