<template>
  <div class="auction-house-overlay">
    <div class="auction-controls">
      <button class="control-btn" @click="refreshAuctions">
        [Làm Mới]
      </button>
      <button class="control-btn" @click="showCreateModal = true">
        [Tạo Đấu Giá]
      </button>
    </div>

    <!-- Auction List -->
    <div v-if="auctions.length > 0" class="auction-list">
      <div
        v-for="auction in auctions"
        :key="auction.id"
        class="auction-item"
        :class="{ 'has-buyout': auction.buyoutPrice }"
      >
        <div class="auction-header">
          <span class="item-name">[{{ auction.item.name }}]</span>
          <span class="item-type">{{ getItemType(auction.item.type) }}</span>
        </div>

        <div class="auction-info">
          <div class="info-row">
            <span class="label">Người bán:</span>
            <span class="value">{{ auction.seller.username }} (Lv.{{ auction.seller.level }})</span>
          </div>
          <div class="info-row">
            <span class="label">Giá hiện tại:</span>
            <span class="value gold">{{ auction.currentBid || auction.startingPrice }} vàng</span>
          </div>
          <div v-if="auction.buyoutPrice" class="info-row">
            <span class="label">Giá mua ngay:</span>
            <span class="value buyout">{{ auction.buyoutPrice }} vàng</span>
          </div>
          <div class="info-row">
            <span class="label">Thời gian còn lại:</span>
            <span class="value">{{ getTimeRemaining(auction.expiresAt) }}</span>
          </div>
          <div v-if="auction.currentBidder" class="info-row">
            <span class="label">Người đặt giá:</span>
            <span class="value">{{ auction.currentBidder.username }}</span>
          </div>
        </div>

        <div class="auction-actions">
          <button
            v-if="auction.seller.id !== currentPlayerId"
            class="action-btn bid"
            @click="openBidModal(auction)"
          >
            [Đặt Giá]
          </button>
          <button
            v-if="auction.buyoutPrice && auction.seller.id !== currentPlayerId"
            class="action-btn buyout"
            @click="buyoutAuction(auction.id)"
          >
            [Mua Ngay]
          </button>
        </div>
      </div>
    </div>

    <div v-else class="no-auctions">
      <p>Hiện không có đấu giá nào.</p>
    </div>

    <!-- Bid Modal -->
    <div v-if="showBidModal" class="modal-overlay" @click.self="showBidModal = false">
      <div class="modal-content">
        <h3>Đặt Giá</h3>
        <p v-if="selectedAuction">
          Vật phẩm: <span class="highlight">{{ selectedAuction.item.name }}</span>
        </p>
        <p v-if="selectedAuction">
          Giá tối thiểu: <span class="gold">{{ getMinBid(selectedAuction) }} vàng</span>
        </p>
        <input
          v-model.number="bidAmount"
          type="number"
          :min="getMinBid(selectedAuction)"
          placeholder="Nhập số vàng"
          class="bid-input"
        />
        <div class="modal-actions">
          <button class="modal-btn confirm" @click="confirmBid">Xác Nhận</button>
          <button class="modal-btn cancel" @click="showBidModal = false">Hủy</button>
        </div>
      </div>
    </div>

    <!-- Create Auction Modal (Placeholder) -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h3>Tạo Đấu Giá</h3>
        <p>Sử dụng lệnh trong game để tạo đấu giá:</p>
        <p class="cmd">auction create [itemId] [startPrice] [buyoutPrice]</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showCreateModal = false">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface AuctionItem {
  id: string;
  item: {
    _id: string;
    name: string;
    type: string;
  };
  seller: {
    id: string;
    username: string;
    level: number;
  };
  startingPrice: number;
  currentBid: number;
  currentBidder?: {
    id: string;
    username: string;
  };
  buyoutPrice?: number;
  expiresAt: Date;
}

const props = defineProps<{
  currentPlayerId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const auctions = ref<AuctionItem[]>([]);
const showBidModal = ref(false);
const showCreateModal = ref(false);
const selectedAuction = ref<AuctionItem | null>(null);
const bidAmount = ref(0);

async function refreshAuctions() {
  try {
    const response = await $fetch('/api/auction/list');
    if (response.success) {
      auctions.value = response.auctions;
    }
  } catch (error) {
    console.error('Failed to load auctions:', error);
  }
}

function openBidModal(auction: AuctionItem) {
  selectedAuction.value = auction;
  bidAmount.value = getMinBid(auction);
  showBidModal.value = true;
}

function getMinBid(auction: AuctionItem): number {
  return auction.currentBid > 0 ? auction.currentBid + 5 : auction.startingPrice;
}

async function confirmBid() {
  if (!selectedAuction.value) return;

  try {
    const response = await $fetch('/api/auction/bid', {
      method: 'POST',
      body: {
        auctionId: selectedAuction.value.id,
        bidAmount: bidAmount.value
      }
    });

    if (response.success) {
      showBidModal.value = false;
      await refreshAuctions();
    }
  } catch (error: any) {
    console.error('Failed to bid:', error);
    alert(error.data?.statusMessage || 'Lỗi khi đặt giá.');
  }
}

async function buyoutAuction(auctionId: string) {
  if (!confirm('Bạn có chắc muốn mua ngay?')) return;

  try {
    const response = await $fetch('/api/auction/buyout', {
      method: 'POST',
      body: { auctionId }
    });

    if (response.success) {
      await refreshAuctions();
      alert(response.message);
    }
  } catch (error: any) {
    console.error('Failed to buyout:', error);
    alert(error.data?.statusMessage || 'Lỗi khi mua ngay.');
  }
}

function getItemType(type: string): string {
  const types: Record<string, string> = {
    weapon: 'Vũ khí',
    armor: 'Giáp',
    consumable: 'Tiêu hao',
    misc: 'Vật khác',
    craftingMaterial: 'Nguyên liệu',
    recipe: 'Công thức',
    furniture: 'Đồ nội thất'
  };
  return types[type] || type;
}

function getTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return 'Đã hết hạn';

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

onMounted(() => {
  refreshAuctions();
});
</script>

<style scoped>
.auction-house-overlay {
  font-family: 'VT323', 'Source Code Pro', monospace;
  color: var(--text-bright);
  padding: 1rem;
}

.auction-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  background: rgba(0, 136, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.5);
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(0, 255, 0, 0.2);
  border-color: var(--text-accent);
}

.auction-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auction-item {
  padding: 1rem;
  border: 1px solid rgba(0, 136, 0, 0.3);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.auction-item.has-buyout {
  border-color: rgba(255, 176, 0, 0.5);
}

.auction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 136, 0, 0.3);
}

.item-name {
  color: var(--text-accent);
  font-size: 1.1em;
}

.item-type {
  color: var(--text-dim);
  font-size: 0.9em;
}

.auction-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
}

.label {
  color: var(--text-dim);
}

.value {
  color: var(--text-bright);
}

.value.gold {
  color: var(--text-accent);
}

.value.buyout {
  color: #ffaa00;
}

.auction-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  flex: 1;
  padding: 0.5rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn.bid {
  background: rgba(0, 136, 0, 0.2);
  border: 1px solid rgba(0, 136, 0, 0.5);
  color: var(--text-system);
}

.action-btn.bid:hover {
  background: rgba(0, 255, 0, 0.2);
  border-color: var(--text-system);
}

.action-btn.buyout {
  background: rgba(255, 176, 0, 0.2);
  border: 1px solid rgba(255, 176, 0, 0.5);
  color: var(--text-accent);
}

.action-btn.buyout:hover {
  background: rgba(255, 176, 0, 0.3);
  border-color: var(--text-accent);
}

.no-auctions {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-black);
  border: 2px solid var(--text-accent);
  border-radius: 4px;
  padding: 2rem;
  min-width: 400px;
  max-width: 90%;
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: var(--text-accent);
}

.modal-content p {
  margin: 0.5rem 0;
  color: var(--text-bright);
}

.highlight {
  color: var(--text-accent);
}

.gold {
  color: var(--text-accent);
}

.cmd {
  color: var(--text-system);
  font-family: 'VT323', 'Source Code Pro', monospace;
  background: rgba(0, 136, 0, 0.1);
  padding: 0.5rem;
  border-left: 2px solid var(--text-accent);
  margin: 1rem 0;
}

.bid-input {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 136, 0, 0.5);
  color: var(--text-bright);
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-btn {
  flex: 1;
  padding: 0.75rem;
  font-family: 'VT323', 'Source Code Pro', monospace;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-btn.confirm {
  background: rgba(0, 136, 0, 0.3);
  border: 1px solid rgba(0, 136, 0, 0.5);
  color: var(--text-system);
}

.modal-btn.confirm:hover {
  background: rgba(0, 255, 0, 0.3);
  border-color: var(--text-system);
}

.modal-btn.cancel {
  background: rgba(136, 0, 0, 0.3);
  border: 1px solid rgba(255, 0, 0, 0.5);
  color: var(--text-error);
}

.modal-btn.cancel:hover {
  background: rgba(255, 0, 0, 0.3);
  border-color: var(--text-error);
}
</style>
