// Placeholder for Phase 3 analytics integration
import { supabase } from './supabase';

export const logEvent = async (eventName: string, params: Record<string, any> = {}) => {
  console.log(`[Analytics] Event: ${eventName}`, params);
  
  // Future: track events in Supabase 'events' table
  /*
  const { error } = await supabase
    .from('events')
    .insert([{ event_name: eventName, metadata: params }]);
  */
};

export const trackScreenView = (screenName: string) => {
  logEvent('screen_view', { screen_name: screenName });
};
