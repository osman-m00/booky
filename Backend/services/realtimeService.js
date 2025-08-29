import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";

// Store channels to reuse them
const channels = {};

export const realTimeService = {
  // ----------------------
  // Subscribe Functions
  // ----------------------
  subscribeToMessages: (groupId, callback) => {
    const key = `messages:${groupId}`;
    if (!channels[key]) {
      channels[key] = supabase
        .channel(key)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
          payload => callback(payload)
        )
        .subscribe();
    }
    return channels[key];
  },

  subscribeToReviews: (bookId, callback) => {
    const key = `reviews:${bookId}`;
    if (!channels[key]) {
      channels[key] = supabase
        .channel(key)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reviews", filter: `book_id=eq.${bookId}` },
          payload => callback(payload)
        )
        .subscribe();
    }
    return channels[key];
  },

  subscribeToGroupParticipants: (groupId, callback) => {
    const key = `group_participants:${groupId}`;
    if (!channels[key]) {
      channels[key] = supabase
        .channel(key)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "group_participants", filter: `group_id=eq.${groupId}` },
          payload => callback(payload)
        )
        .subscribe();
    }
    return channels[key];
  },

  // ✅ New: subscribe to groups metadata (updates, deletes, etc.)
  subscribeToGroups: (groupId, callback) => {
    const key = `groups:${groupId}`;
    if (!channels[key]) {
      channels[key] = supabase
        .channel(key)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "groups", filter: `id=eq.${groupId}` },
          payload => callback(payload)
        )
        .subscribe();
    }
    return channels[key];
  },

  // ----------------------
  // Broadcast Functions
  // ----------------------
  broadcastMessage: (groupId, payload) => {
    const key = `messages:${groupId}`;
    if (!channels[key]) {
      channels[key] = supabase.channel(key).subscribe();
    }
    channels[key].send({
      type: "broadcast",
      event: "message_change",
      payload,
    });
  },

  broadcastReview: (bookId, payload) => {
    const key = `reviews:${bookId}`;
    if (!channels[key]) {
      channels[key] = supabase.channel(key).subscribe();
    }
    channels[key].send({
      type: "broadcast",
      event: "review_change",
      payload,
    });
  },

  broadcastGroupParticipant: (groupId, payload) => {
    const key = `group_participants:${groupId}`;
    if (!channels[key]) {
      channels[key] = supabase.channel(key).subscribe();
    }
    channels[key].send({
      type: "broadcast",
      event: "participant_change",
      payload,
    });
  },

  // ✅ New: broadcast group updates (metadata changes)
  broadcastGroup: (groupId, payload) => {
    const key = `groups:${groupId}`;
    if (!channels[key]) {
      channels[key] = supabase.channel(key).subscribe();
    }
    channels[key].send({
      type: "broadcast",
      event: "group_change",
      payload,
    });
  },
};
