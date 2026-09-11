export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    area.style.pointerEvents = "none";

    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);

    const copied = document.execCommand("copy");
    area.remove();

    return copied;
  } catch {
    return false;
  }
}
