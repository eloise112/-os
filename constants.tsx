
import React from 'react';
import { Character, WorldState, Ticket } from './types';

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'char1',
    name: '沈逸 (Shen Yi)',
    avatar: 'https://picsum.photos/seed/shenyi/200/200',
    background: '冷淡而深情的跨国企业总裁，与你在商业晚宴上初遇。',
    preferences: '喜欢清茶、古典乐、雨天。讨厌嘈杂和背叛。',
    storyline: '目前由于一次项目竞争，你们处于某种微妙的博弈关系中，但他的话语间似乎带着某种怀旧。',
    perceiveWorldNews: true,
    perceiveSocialMedia: true,
    perceiveUserPersona: true
  },
  {
    id: 'char2',
    name: '林浅 (Lin Qian)',
    avatar: 'https://picsum.photos/seed/linqian/200/200',
    background: '古灵精怪的天才黑客，是你的童年玩伴，也是你最可靠的秘密支持者。',
    preferences: '喜欢可乐、电子游戏、深夜代码。讨厌繁琐的社交规则。',
    storyline: '她最近在帮你调查一个神秘包裹的来源。',
    perceiveWorldNews: true,
    perceiveSocialMedia: true,
    perceiveUserPersona: true
  }
];

export const INITIAL_WORLD: WorldState = {
  worldDescription: '一个近未来的都市，科技高度发达但社会贫富差距显著。由于神秘物质的出现，世界正处于能源革命的前夕。',
  currentDate: '2025-05-15',
  news: [
    {
      id: 'news1',
      title: '极光能源今日宣布突破性进展',
      content: '该技术有望将全球电力成本降低30%...',
      category: '科技',
      timestamp: Date.now()
    }
  ],
  tickets: [
    {
      id: 't1',
      title: '张杰 2025 全球巡演 - 上海站',
      date: '2025-08-20',
      price: 1280,
      category: 'concert',
      image: 'https://picsum.photos/seed/concert1/300/400'
    },
    {
      id: 't2',
      title: '赛博朋克 2077: 电影版',
      date: '2025-06-01',
      price: 90,
      category: 'movie',
      image: 'https://picsum.photos/seed/movie1/300/400'
    }
  ],
  hotSearches: [
    { id: 'h1', title: '极光能源突破性进展', hotness: '450w', tag: '爆' },
    { id: 'h2', title: '沈氏集团年度晚宴', hotness: '220w', tag: '热' },
    { id: 'h3', title: '赛博咖啡馆新品上市', hotness: '110w', tag: '新' }
  ],
  enableMomentsInteraction: true,
  maxMomentReplies: 4
};
