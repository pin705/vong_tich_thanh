import { ref } from 'vue';

export function useGamePopups() {
  // Popup states
  const helpOpen = ref(false);
  const characterMenuOpen = ref(false);
  const settingsOpen = ref(false);
  const worldMapOpen = ref(false);
  const questsOpen = ref(false);
  const professionChoiceOpen = ref(false);
  const inventoryPopupOpen = ref(false);
  const mapPopupOpen = ref(false);
  const occupantsPopupOpen = ref(false);
  const contextualPopupOpen = ref(false);
  const tradingPopupOpen = ref(false);
  const partyPopupOpen = ref(false);
  const partyInvitationPopupOpen = ref(false);
  const guildPopupOpen = ref(false);
  const auctionHousePopupOpen = ref(false);
  const premiumShopPopupOpen = ref(false);
  const craftingPopupOpen = ref(false);
  const shopPopupOpen = ref(false);
  const mailPopupOpen = ref(false);
  const petPopupOpen = ref(false);
  const blacksmithPopupOpen = ref(false);
  const leaderboardOpen = ref(false);
  const guildInvitationPopupOpen = ref(false);
  
  function toggleHelp() {
    helpOpen.value = !helpOpen.value;
  }
  
  function openCharacterMenu() {
    characterMenuOpen.value = true;
  }
  
  function openSettings() {
    settingsOpen.value = true;
  }
  
  function openWorldMap() {
    worldMapOpen.value = true;
  }
  
  function openQuests() {
    questsOpen.value = true;
  }
  
  function openInventory() {
    inventoryPopupOpen.value = true;
  }
  
  function openMap() {
    mapPopupOpen.value = true;
  }
  
  function openOccupants() {
    occupantsPopupOpen.value = true;
  }
  
  function openTrading() {
    tradingPopupOpen.value = true;
  }
  
  function openParty() {
    partyPopupOpen.value = true;
  }
  
  function openGuild() {
    guildPopupOpen.value = true;
  }
  
  function openAuctionHouse() {
    auctionHousePopupOpen.value = true;
  }
  
  function openPremiumShop() {
    premiumShopPopupOpen.value = true;
  }
  
  function openCrafting() {
    craftingPopupOpen.value = true;
  }
  
  function openShop() {
    shopPopupOpen.value = true;
  }
  
  function openMail() {
    mailPopupOpen.value = true;
  }

  function openPet() {
    petPopupOpen.value = true;
  }

  function openBlacksmith() {
    blacksmithPopupOpen.value = true;
  }

  function openLeaderboard() {
    leaderboardOpen.value = true;
  }
  
  function closeAllPopups() {
    helpOpen.value = false;
    characterMenuOpen.value = false;
    settingsOpen.value = false;
    worldMapOpen.value = false;
    questsOpen.value = false;
    professionChoiceOpen.value = false;
    inventoryPopupOpen.value = false;
    mapPopupOpen.value = false;
    occupantsPopupOpen.value = false;
    contextualPopupOpen.value = false;
    tradingPopupOpen.value = false;
    partyPopupOpen.value = false;
    partyInvitationPopupOpen.value = false;
    guildPopupOpen.value = false;
    guildInvitationPopupOpen.value = false;
    auctionHousePopupOpen.value = false;
    premiumShopPopupOpen.value = false;
    craftingPopupOpen.value = false;
    shopPopupOpen.value = false;
    mailPopupOpen.value = false;
    petPopupOpen.value = false;
    blacksmithPopupOpen.value = false;
    leaderboardOpen.value = false;
  }
  
  return {
    // States
    helpOpen,
    characterMenuOpen,
    settingsOpen,
    worldMapOpen,
    questsOpen,
    professionChoiceOpen,
    inventoryPopupOpen,
    mapPopupOpen,
    occupantsPopupOpen,
    contextualPopupOpen,
    tradingPopupOpen,
    partyPopupOpen,
    partyInvitationPopupOpen,
    guildPopupOpen,
    guildInvitationPopupOpen,
    auctionHousePopupOpen,
    premiumShopPopupOpen,
    craftingPopupOpen,
    shopPopupOpen,
    mailPopupOpen,
    petPopupOpen,
    blacksmithPopupOpen,
    leaderboardOpen,
    
    // Actions
    toggleHelp,
    openCharacterMenu,
    openSettings,
    openWorldMap,
    openQuests,
    openInventory,
    openMap,
    openOccupants,
    openTrading,
    openParty,
    openGuild,
    openAuctionHouse,
    openPremiumShop,
    openCrafting,
    openShop,
    openMail,
    openPet,
    openBlacksmith,
    openLeaderboard,
    closeAllPopups
  };
}
