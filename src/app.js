import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'

// ── Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#f7f5f0', paper: '#ffffff', ink: '#1a1a1a',
  inkMid: '#6b6560', inkFaint: '#b0aca6', rule: '#e8e4df',
  green: '#2d7a4f', greenBg: '#edf7f1',
  amber: '#b45309', amberBg: '#fef3e2',
  red: '#c0392b', redBg: '#fdf0ef',
  blue: '#1d4ed8', blueBg: '#eff6ff',
  purple: '#7c3aed', purpleBg: '#f5f3ff',
}

const CATS = [
  { id: 'cozinha', label: 'Cozinha', emoji: '🍳' },
  { id: 'casa',    label: 'Casa',    emoji: '🏠' },
  { id: 'tech',    label: 'Tech',    emoji: '💻' },
  { id: 'saude',   label: 'Saúde',  emoji: '🏃' },
  { id: 'outro',   label: 'Outro',   emoji: '📦' },
]

const PRIOS = [
  { id: 'logo',      label: 'Assim que der', color: C.green,  bg: C.greenBg },
  { id: 'planejado', label: 'Planejado',      color: C.amber,  bg: C.amberBg },
  { id: 'sonho',     label: 'Um dia',         color: C.purple, bg: C.purpleBg },
]

const STATUSES = [
  { id: 'quero',       label: 'Quero comprar', color: C.inkMid, bg: '#f0ede8', emoji: '🛒' },
  { id: 'pesquisando', label: 'Pesquisando',   color: C.blue,   bg: C.blueBg,  emoji: '🔍' },
  { id: 'aguardando',  label: 'Aguardando',    color: C.amber,  bg: C.amberBg, emoji: '⏳' },
  { id: 'comprado',    label: 'Comprado',      color: C.green,  bg: C.greenBg, emoji: '✓'  },
]

const DEMO_ITEMS = [
  {
    id: 1, name: 'Máquina de lavar louças', brand: 'Brastemp', model: 'BLF08AB',
    estimatedPrice: 2800, paidPrice: null, cat: 'cozinha', prio: 'logo',
    status: 'pesquisando', note: 'Pelo menos 8 serviços', store: 'Magazine Luiza', storeLink: '',
    votes: { a: true, b: true },
    priceHistory: [
      { price: 3100, date: '2026-04-01', note: 'preço inicial' },
      { price: 2800, date: '2026-06-01', note: 'achou promoção' },
    ],
    addedAt: '2026-04-01',
  },
  {
    id: 2, name: 'Balança para café', brand: 'Felicita', model: 'Arc',
    estimatedPrice: 380, paidPrice: null, cat: 'cozinha', prio: 'logo',
    status: 'quero', note: '', store: '', storeLink: '',
    votes: { a: true, b: false }, priceHistory: [], addedAt: '2026-06-01',
  },
  {
