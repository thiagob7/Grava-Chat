export async function downloadImage(url: string, name: string) {
  try {
    const reply = await fetch(url);
    const file = await reply.blob();
    const address = URL.createObjectURL(file);
    const anchor = document.createElement("a");

    anchor.href = address;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(address);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export async function copyImage(url: string): Promise<boolean> {
  try {
    const reply = await fetch(url);
    const file = await reply.blob();

    const png =
      file.type === "image/png"
        ? file
        : await new Promise<Blob | null>((resolve) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
              const screen = document.createElement("canvas");
              screen.width = image.naturalWidth;
              screen.height = image.naturalHeight;
              screen.getContext("2d")?.drawImage(image, 0, 0);
              screen.toBlob(resolve, "image/png");
            };
            image.onerror = () => resolve(null);
            image.src = URL.createObjectURL(file);
          });

    if (!png) return false;

    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    return true;
  } catch {
    return false;
  }
}
