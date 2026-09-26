const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const navigationGroups = ['.site-header nav', '.article-contents nav'].map(selector => {
  const links = [...document.querySelectorAll(`${selector} a`)];
  return links.map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter(({ section }) => section);
}).filter(group => group.length);

const readingArea = document.querySelector('.writeup-body');
const contents = document.querySelector('.article-contents');
let progressFill;
if (readingArea && contents) {
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  progressFill = document.createElement('span');
  progress.append(progressFill);
  contents.prepend(progress);
}

const header = document.querySelector('.site-header');
const activeEntries = new Map();
let previousProgress;
let framePending = false;
function updateReadingPosition() {
  framePending = false;
  const anchorOffset = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  // Match the anchor landing position, including fractional scroll rounding.
  const readingLine = Math.max(anchorOffset, (header?.getBoundingClientRect().bottom ?? 0) + 32) + 1;
  const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  // Read geometry before changing attributes or styles.
  const currentEntries = navigationGroups.map(group => {
    let current = group[0];
    for (const entry of group) {
      if (entry.section.getBoundingClientRect().top <= readingLine) current = entry;
    }
    if (atPageEnd) current = group[group.length - 1];
    return current;
  });
  let progress;
  if (progressFill) {
    const bounds = readingArea.getBoundingClientRect();
    const distance = bounds.height - window.innerHeight + readingLine;
    progress = distance > 0
      ? Math.min(1, Math.max(0, (readingLine - bounds.top) / distance))
      : bounds.bottom <= window.innerHeight ? 1 : 0;
  }
  navigationGroups.forEach((group, index) => {
    const current = currentEntries[index];
    const previous = activeEntries.get(group);
    if (current === previous) return;
    previous?.link.removeAttribute('aria-current');
    current.link.setAttribute('aria-current', 'location');
    activeEntries.set(group, current);
  });
  if (progressFill && progress !== previousProgress) {
    progressFill.style.transform = `scaleX(${progress})`;
    previousProgress = progress;
  }
}
function scheduleReadingUpdate() {
  if (!framePending) {
    framePending = true;
    window.requestAnimationFrame(updateReadingPosition);
  }
}
window.addEventListener('scroll', scheduleReadingUpdate, { passive: true });
window.addEventListener('resize', scheduleReadingUpdate);
window.addEventListener('pageshow', scheduleReadingUpdate);
updateReadingPosition();
