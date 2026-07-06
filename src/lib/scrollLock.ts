let lockCount = 0;

export function lockScroll(): void {
  if (typeof document === "undefined") return;

  lockCount += 1;
  if (lockCount > 1) return;

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

export function unlockScroll(): void {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

export function forceUnlockScroll(): void {
  if (typeof document === "undefined") return;

  const fixedTop = document.body.style.top;
  let scrollY = window.scrollY;
  if (fixedTop) {
    const parsed = parseInt(fixedTop, 10);
    if (!Number.isNaN(parsed)) {
      scrollY = Math.abs(parsed);
    }
  }

  lockCount = 0;
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, scrollY);
}
