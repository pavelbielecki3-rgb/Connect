import React from 'react';

export const AVATAR_ASSETS = {
  clothes: {
    basic: [{ id: 'tshirt', name: 'Základní tričko', color: '#3b82f6' }],
    extended: [
      { id: 'tshirt', name: 'Základní tričko', color: '#3b82f6' },
      { id: 'hoodie', name: 'Mikina', color: '#8b5cf6' },
      { id: 'jacket', name: 'Bunda', color: '#10b981' }
    ],
    premium: [
      { id: 'tshirt', name: 'Základní tričko', color: '#3b82f6' },
      { id: 'hoodie', name: 'Mikina', color: '#8b5cf6' },
      { id: 'jacket', name: 'Bunda', color: '#10b981' },
      { id: 'suit', name: 'Oblek', color: '#18181b' },
      { id: 'dress', name: 'Šaty', color: '#ec4899' },
      { id: 'tank', name: 'Tílko', color: '#f59e0b' },
      { id: 'sweater', name: 'Svetr', color: '#ef4444' },
      { id: 'coat', name: 'Kabát', color: '#78350f' },
      { id: 'sport', name: 'Sportovní', color: '#06b6d4' }
    ]
  },
  hair: {
    basic: [{ id: 'none', name: 'Bez vlasů' }],
    extended: [
      { id: 'none', name: 'Bez vlasů' },
      { id: 'short', name: 'Krátké' },
      { id: 'long', name: 'Dlouhé' }
    ],
    premium: [
      { id: 'none', name: 'Bez vlasů' },
      { id: 'short', name: 'Krátké' },
      { id: 'long', name: 'Dlouhé' },
      { id: 'curly', name: 'Kudrnaté' },
      { id: 'spiky', name: 'Ježek' },
      { id: 'ponytail', name: 'Culík' }
    ]
  }
};

export function getAvatarHtml(config: { clothes?: string, hair?: string } | undefined, size: number = 44) {
  if (!config) return '';
  
  const clothesColor = AVATAR_ASSETS.clothes.premium.find(c => c.id === config.clothes)?.color || '#3b82f6';
  
  // Scale factor based on base size 192 (48 * 4)
  const scale = size / 192;

  let clothesHtml = '';
  if (config.clothes === 'suit') {
    clothesHtml = `
      <div style="position: absolute; left: 0; right: 0; top: 0; height: 100%; display: flex; justify-content: center;">
        <div style="width: ${32 * scale}px; height: 100%; background-color: white; display: flex; justify-content: center;">
          <div style="width: ${8 * scale}px; height: 100%; background-color: #18181b;"></div>
        </div>
      </div>
    `;
  } else if (config.clothes === 'dress') {
    clothesHtml = `<div style="position: absolute; left: 0; right: 0; top: 0; height: ${16 * scale}px; background-color: #f472b6; border-top-left-radius: ${24 * scale}px; border-top-right-radius: ${24 * scale}px;"></div>`;
  }

  let hairHtml = '';
  if (config.hair === 'short') {
    hairHtml = `<div style="position: absolute; top: -${8 * scale}px; left: 0; right: 0; height: ${24 * scale}px; background-color: #27272a; border-top-left-radius: 9999px; border-top-right-radius: 9999px;"></div>`;
  } else if (config.hair === 'long') {
    hairHtml = `<div style="position: absolute; top: -${8 * scale}px; left: -${8 * scale}px; right: -${8 * scale}px; height: ${80 * scale}px; background-color: #27272a; border-top-left-radius: 9999px; border-top-right-radius: 9999px; z-index: -10;"></div>`;
  } else if (config.hair === 'curly') {
    hairHtml = `<div style="position: absolute; top: -${16 * scale}px; left: -${12 * scale}px; right: -${12 * scale}px; height: ${48 * scale}px; background-color: #92400e; border-radius: 9999px; opacity: 0.9;"></div>`;
  } else if (config.hair === 'spiky') {
    hairHtml = `
      <div style="position: absolute; top: -${16 * scale}px; left: 0; right: 0; display: flex; justify-content: space-around; padding: 0 ${8 * scale}px;">
        <div style="width: ${8 * scale}px; height: ${24 * scale}px; background-color: #3f3f46; transform: rotate(-12deg);"></div>
        <div style="width: ${8 * scale}px; height: ${32 * scale}px; background-color: #3f3f46;"></div>
        <div style="width: ${8 * scale}px; height: ${24 * scale}px; background-color: #3f3f46; transform: rotate(12deg);"></div>
      </div>
    `;
  } else if (config.hair === 'ponytail') {
    hairHtml = `
      <div style="position: absolute; top: -${8 * scale}px; left: 0; right: 0; height: ${24 * scale}px; background-color: #78350f; border-top-left-radius: 9999px; border-top-right-radius: 9999px;"></div>
      <div style="position: absolute; top: 0; right: -${16 * scale}px; width: ${24 * scale}px; height: ${48 * scale}px; background-color: #78350f; border-radius: 9999px; transform: rotate(45deg); z-index: -10;"></div>
    `;
  }

  return `
    <div style="width: ${size}px; height: ${size}px; background-color: #27272a; border-radius: 50%; overflow: hidden; display: flex; align-items: flex-end; justify-content: center; position: relative;">
      <div style="width: ${128 * scale}px; height: ${80 * scale}px; border-top-left-radius: ${24 * scale}px; border-top-right-radius: ${24 * scale}px; position: absolute; bottom: 0; background-color: ${clothesColor}; transition: background-color 0.3s;">
        ${clothesHtml}
      </div>
      <div style="width: ${80 * scale}px; height: ${96 * scale}px; background-color: #fde68a; border-radius: 50%; position: absolute; bottom: ${64 * scale}px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="display: flex; gap: ${16 * scale}px; margin-top: ${8 * scale}px;">
          <div style="width: ${8 * scale}px; height: ${8 * scale}px; background-color: #18181b; border-radius: 50%;"></div>
          <div style="width: ${8 * scale}px; height: ${8 * scale}px; background-color: #18181b; border-radius: 50%;"></div>
        </div>
        <div style="width: ${24 * scale}px; height: ${12 * scale}px; border-bottom: ${2 * scale}px solid #18181b; border-radius: 50%; margin-top: ${12 * scale}px;"></div>
        ${hairHtml}
      </div>
    </div>
  `;
}

export default function AvatarDisplay({ config, size = 192 }: { config?: { clothes?: string, hair?: string }, size?: number }) {
  if (!config) return null;
  return <div dangerouslySetInnerHTML={{ __html: getAvatarHtml(config, size) }} />;
}
