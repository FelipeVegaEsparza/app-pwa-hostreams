import { config } from './config.js';

async function getApiBase() {
  const configData = await config;
  return `${configData.ipstream_base_url}/${configData.clientId}`;
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.json().catch(()=>null);
      throw new Error(errBody?.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.error('API error', e);
    throw e;
  }
}

export async function getAllClientData() { 
  const base = await getApiBase();
  return await fetchJSON(`${base}`); 
}

export async function getBasicData() { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/basic-data`); 
}

export async function getPrograms() { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/programs`); 
}

export async function getNews(page = 1, limit = 10) { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/news?page=${page}&limit=${limit}`); 
}

export async function getNewsBySlug(slug) { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/news/${slug}`); 
}

export async function getVideos() { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/videos`); 
}

export async function getSponsors() { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/sponsors`); 
}

export async function getPromotions() { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/promotions`); 
}

export async function getPodcasts(page = 1, limit = 10) { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/podcasts?page=${page}&limit=${limit}`); 
}

export async function getPodcastById(id) { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/podcasts/${id}`); 
}

export async function getVideocasts(page = 1, limit = 10) { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/videocasts?page=${page}&limit=${limit}`); 
}

export async function getVideocastById(id) { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/videocasts/${id}`); 
}

export async function getSocialNetworks() { 
  const base = await getApiBase();
  return await fetchJSON(`${base}/social-networks`); 
}

export async function buildImageUrl(path) {
  const configData = await config;
  // Extraer el dominio base de la URL de la API
  const baseUrl = configData.ipstream_base_url.replace('/api/public', '');
  return `${baseUrl}${path}`;
}

// SonicPanel API Functions
export async function getSonicPanelInfo() {
  const configData = await config;
  
  // Usar puerto directo si existe, sino extraer del stream URL
  let port = configData.sonicpanel_port;
  
  if (!port) {
    // Extraer el puerto del stream URL como fallback
    const streamUrl = configData.sonicpanel_stream_url;
    const portMatch = streamUrl.match(/:(\d+)/);
    port = portMatch ? portMatch[1] : '8018';
  }
  
  // Construir la URL de la API de SonicPanel
  const apiUrl = configData.sonicpanel_api_url || `https://stream.ipstream.cl/cp/get_info.php?p=${port}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching SonicPanel info:', error);
    throw error;
  }
}

export async function getCurrentSong() {
  try {
    const configData = await config;
    const projectName = configData.project_name || 'Radio';
    const data = await getSonicPanelInfo();
    
    // Separar título en artista y canción si viene en formato "Artista - Canción"
    let artist = 'En Vivo';
    let songTitle = projectName;
    
    if (data.title && data.title.trim() !== '') {
      if (data.title.includes(' - ')) {
        const parts = data.title.split(' - ');
        artist = parts[0].trim();
        songTitle = parts.slice(1).join(' - ').trim();
      } else {
        songTitle = data.title.trim();
      }
    }
    
    // Si hay DJ, usar su nombre como artista
    if (data.djusername && data.djusername !== 'No DJ' && data.djusername !== 'AutoDJ') {
      artist = data.djusername;
    }
    
    return {
      title: songTitle,
      artist: artist,
      fullTitle: data.title || projectName,
      art: data.art || null,
      listeners: parseInt(data.listeners) || 0,
      uniqueListeners: parseInt(data.ulistener) || 0,
      bitrate: data.bitrate || 'N/A',
      djUsername: data.djusername || null,
      djProfile: data.djprofile || null,
      history: data.history || []
    };
  } catch (error) {
    const configData = await config;
    const projectName = configData.project_name || 'Radio';
    console.error('Error getting current song:', error);
    return {
      title: projectName,
      artist: 'En Vivo',
      fullTitle: projectName,
      art: null,
      listeners: 0,
      uniqueListeners: 0,
      bitrate: 'N/A',
      djUsername: null,
      djProfile: null,
      history: []
    };
  }
}