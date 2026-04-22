// Draggable Discord Popup
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;
let popup = null;

document.addEventListener('DOMContentLoaded', function() {
  // Create popup if not exists
  if (!document.getElementById('discord-popup')) {
    const popupDiv = document.createElement('div');
    popupDiv.id = 'discord-popup';
    popupDiv.innerHTML = `
      <div class="discord-floating-popup" draggable="true">
        <i class="fab fa-discord"></i>
        <div class="discord-tooltip">Join our Server!</div>
      </div>
    `;
    document.body.appendChild(popupDiv);
  }
  
  popup = document.getElementById('discord-popup');
  const popupBtn = popup.querySelector('.discord-floating-popup');
  
  popupBtn.addEventListener('mousedown', dragStart);
  popupBtn.addEventListener('dblclick', joinDiscord);
  
  // Snap to corners
  popup.addEventListener('mouseleave', snapToCorner);
});

function dragStart(e) {
  if (e.target.tagName === 'I') return;
  
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;

  if (e.target === popup.querySelector('.discord-floating-popup')) {
    isDragging = true;
    popup.classList.add('dragging');
  }
}

document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag);

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;

    popup.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  }
}

document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', dragEnd);

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;
  
  isDragging = false;
  popup.classList.remove('dragging');
}

function snapToCorner() {
  if (!popup) return;
  
  const rect = popup.getBoundingClientRect();
  const snapDistance = 100;
  
  if (rect.right < snapDistance) {
    popup.style.transform = `translate3d(20px, calc(100vh - ${rect.height + 40}px), 0)`;
  } else if (rect.left > window.innerWidth - snapDistance) {
    popup.style.transform = `translate3d(calc(100vw - ${rect.width + 20}px), calc(100vh - ${rect.height + 40}px), 0)`;
  } else if (rect.top > window.innerHeight - snapDistance) {
    popup.style.transform = `translate3d(calc(100vw - ${rect.width + 20}px), 20px, 0)`;
  }
}

function joinDiscord() {
  window.open('https://discord.gg/YOUR_DISCORD_INVITE', '_blank');
}

