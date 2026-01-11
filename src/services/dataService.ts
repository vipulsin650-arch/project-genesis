export const dataService = {
  async getRepairs(userId: string) {
    let localData = JSON.parse(localStorage.getItem(`repairit_repairs_${userId}`) || '[]');
    return localData;
  },

  async addRepair(userId: string, repair: any) {
    const newRepair = { 
      ...repair, 
      id: repair.id || crypto.randomUUID(), 
      user_id: userId, 
      created_at: new Date().toISOString() 
    };
    
    const local = JSON.parse(localStorage.getItem(`repairit_repairs_${userId}`) || '[]');
    localStorage.setItem(`repairit_repairs_${userId}`, JSON.stringify([newRepair, ...local]));
  },

  async getMessages(userId: string, expertName: string) {
    // RAM storage for chats (sessionStorage)
    const localMsgs = JSON.parse(sessionStorage.getItem(`repairit_msgs_${userId}_${expertName}`) || '[]');
    return localMsgs;
  },

  async addMessage(userId: string, msg: any) {
    const newMsg = { 
      ...msg, 
      id: msg.id || crypto.randomUUID(),
      user_id: userId, 
      created_at: msg.created_at || new Date().toISOString() 
    };
    
    // RAM storage for chats
    const local = JSON.parse(sessionStorage.getItem(`repairit_msgs_${userId}_${msg.expert_name}`) || '[]');
    sessionStorage.setItem(`repairit_msgs_${userId}_${msg.expert_name}`, JSON.stringify([...local, newMsg]));

    await this.ensureExpertInIndex(userId, msg.expert_name);
  },

  async ensureExpertInIndex(userId: string, expertName: string) {
    // RAM storage for index
    const chatIndexKey = `repairit_chat_index_${userId}`;
    const experts = JSON.parse(sessionStorage.getItem(chatIndexKey) || '[]');
    if (!experts.includes(expertName)) {
      experts.push(expertName);
      sessionStorage.setItem(chatIndexKey, JSON.stringify(experts));
    }
  },

  async getContactedExperts(userId: string): Promise<string[]> {
    const chatIndexKey = `repairit_chat_index_${userId}`;
    return JSON.parse(sessionStorage.getItem(chatIndexKey) || '[]');
  },

  async getUserCoins(userId: string): Promise<number> {
    const localCoins = localStorage.getItem(`repairit_coins_${userId}`);
    let coins = localCoins ? parseInt(localCoins, 10) : 0;
    if (isNaN(coins)) coins = 0;
    return coins;
  },

  async addUserCoins(userId: string, amount: number) {
    const current = await this.getUserCoins(userId);
    const updated = current + amount;
    localStorage.setItem(`repairit_coins_${userId}`, updated.toString());
    return updated;
  }
};
