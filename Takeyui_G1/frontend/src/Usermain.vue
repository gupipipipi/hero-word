<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// --- ステート ---
const items = ref([])
const locations = ref([])
const events = ref([])
const schedules = ref([])
const userOrders = ref([])
const userReservations = ref([]) // 予約キャンセル機能は削除するが、履歴の表示のためにデータ構造は維持

const step = ref(1)
const selectedLocationId = ref(null)
const selectedEventId = ref(null)
const userId = ref('未ログイン')

const selectedPrefecture = ref('')
const selectedPriceRange = ref('')
const locationSortOrder = ref('desc')
const priceSortOrder = ref('asc')

const defaultImage = '/images/vite.svg'

const prefectures = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'
]

// JWT解析
function parseJwt(token) {
  if (!token) return null
  try { return JSON.parse(atob(token.split('.')[1])) } 
  catch { return null }
}

// 初期データ取得
onMounted(() => {
  const token = localStorage.getItem('user-token')
  if (token) {
    const data = parseJwt(token)
    if (data && data.userId) userId.value = data.userId // Login.vueで`userId`として設定されているため
  }

  axios.get('http://localhost:3000/api/items')
    .then(res => { items.value = res.data })
    .catch(err => console.error('商品取得エラー:', err))

  axios.get('http://localhost:3000/api/locations')
    .then(res => { locations.value = res.data })
    .catch(err => console.error('ロケーション取得エラー:', err))
})

// --- 計算 ---
const filteredItems = computed(() => {
  let list = [...items.value]

  // 価格範囲でフィルター
  switch(selectedPriceRange.value) {
    case 'under1000': list = list.filter(i => i.price < 1000); break
    case '1000to5000': list = list.filter(i => i.price >= 1000 && i.price < 5000); break
    case 'above5000': list = list.filter(i => i.price >= 5000); break
  }

  // 価格順でソート
  list.sort((a,b)=>{
    if(priceSortOrder.value==='asc') return a.price - b.price
    else return b.price - a.price
  })

  return list
})

const filteredLocations = computed(() => {
  let list = [...locations.value]
  if(selectedPrefecture.value) list = list.filter(loc=>loc.address.startsWith(selectedPreffecture.value))
  //登録順でソート
  list.sort((a,b)=>{
    if(locationSortOrder.value==='asc') return new Date(a.created_at)-new Date(b.created_at)
    else return new Date(b.created_at)-new Date(a.created_at)
  })
  return list
})

const sortedEvents = computed(()=>[...events.value].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)))
const sortedSchedules = computed(()=>[...schedules.value].sort((a,b)=>new Date(a.event_date)-new Date(b.event_date)))

// --- STEP表示制御 ---
const showAllItems = ref(false)
const limitedItems = computed(()=>showAllItems.value?filteredItems.value:filteredItems.value.slice(0,3))
function toggleShowItems(){ showAllItems.value=!showAllItems.value }

const showAllLocations = ref(false)
const limitedLocations = computed(()=>showAllLocations.value?filteredLocations.value:filteredLocations.value.slice(0,3))
function toggleShowLocations(){ showAllLocations.value=!showAllLocations.value }

const showAllEvents = ref(false)
const limitedEvents = computed(()=>showAllEvents.value?sortedEvents.value:sortedEvents.value.slice(0,3))
function toggleShowEvents(){ showAllEvents.value=!showAllEvents.value }

const showAllSchedules = ref(false)
const limitedSchedules = computed(()=>showAllSchedules.value?sortedSchedules.value:sortedSchedules.value.slice(0,3))
function toggleShowSchedules(){ showAllSchedules.value=!showAllSchedules.value }

// --- UI操作 ---
function goToProducts(){ window.location.href='./register_items.html'; }
function goToExperiences(){ alert('体験登録ページは未実装です。'); }
function buyProduct(item){ alert(`${item.item_name} の購入処理 (未実装)`); }

// 購入履歴・予約画面への遷移
async function goToMyOrders(){
  const token = localStorage.getItem('user-token')
  if(!token){ alert('ログインが必要です。'); return }

  try{
    const res = await axios.get('http://localhost:3000/api/myorders',{
      headers: { 'Authorization': 'Bearer ' + token }
    })
    userOrders.value = res.data.orders
    userReservations.value = res.data.reservations
    step.value=4 // 新しいステップへ
  }catch(err){
    console.error('履歴取得エラー:', err)
    alert('履歴の取得に失敗しました。')
  }
}

// 商品の返品
async function returnProduct(orderId){
  if(!confirm(`注文ID: ${orderId} を返品しますか？`)) return
  const token = localStorage.getItem('user-token')
  try{
    const res = await axios.post(`http://localhost:3000/api/return/product/${orderId}`,{},{
      headers: { 'Authorization': 'Bearer ' + token }
    })
    alert(res.data.message)
    // 成功したらリストを再取得
    goToMyOrders()
  }catch(err){
    alert(err.response.data.message || '返品に失敗しました。')
  }
}

// 予約キャンセル関数は削除

function selectLocation(id){
  selectedLocationId.value=id
  axios.get(`http://localhost:3000/api/events?location_id=${id}`)
    .then(res=>{ events.value=res.data; step.value=2 })
    .catch(err=>{ console.error(err); alert('イベント取得失敗') })
}

function selectEvent(id){
  selectedEventId.value=id
  axios.get(`http://localhost:3000/api/schedules?event_id=${id}`)
    .then(res=>{ schedules.value=res.data; step.value=3 })
    .catch(err=>{ console.error(err); alert('スケジュール取得失敗') })
}

function goBack(){
  if(step.value===4) step.value=1
  else if(step.value===3) step.value=2
  else if(step.value===2) step.value=1
  if(step.value===1){ 
    selectedLocationId.value=null; 
    events.value=[];
    userOrders.value = [];
    userReservations.value = [];
  }
  if(step.value===2){ selectedEventId.value=null; schedules.value=[] }
}

function reserve(scheduleId){
  if(!userId.value || userId.value==='未ログイン'){ alert('ログイン必要'); return }
  const token = localStorage.getItem('user-token')
  axios.post('http://localhost:3000/api/buyevent',{
    schedule_id:scheduleId,
    user_id:userId.value,
    number_of_participants:1,
    status:'reserved'
  },
  {
    headers: { 'Authorization': 'Bearer ' + token }
  }
  ).then(res=>alert(res.data.message||'予約完了')).catch(err=>{ console.error(err); alert('予約失敗') })
}

function formatDate(dt){ return dt? new Date(dt).toLocaleString() : '' }
function formatDateOnly(dt){ return dt? new Date(dt).toLocaleDateString() : '' }
</script>

<template>
  <div class="user-id">ユーザーID: {{ userId }}</div>

  <header class="app-header">
    <img src="/images/vite.svg" alt="アイコン" class="header-icon" />
    <h1 class="header-title">Gbamboo</h1>
    <div class="header-buttons">
      <button @click="goToProducts">製品登録</button>
      <button @click="goToExperiences">体験登録</button>
      <button v-if="userId !== '未ログイン'" @click="goToMyOrders">購入履歴・予約</button>
    </div>
  </header>

  <main class="slider-container">
    
    <div v-if="step===4" class="section-wrapper">
      <button class="go-back-button" @click="goBack">← 戻る</button>
      <h2>購入履歴（商品）</h2>
      
      <div class="card-list-container">
        <div v-if="userOrders.length===0" class="no-data">購入履歴はありません。</div>
        <div class="product-card list-item" v-for="order in userOrders" :key="order.order_id">
          <h3 class="product-name">注文ID: {{ order.order_id }}</h3>
          <p class="product-desc">商品名: {{ order.item_name }}</p>
          <p class="product-desc">数量: {{ order.quantity }}個</p>
          <p class="product-price">合計金額: ¥{{ Number(order.total_amount).toLocaleString() }}</p>
          <p :class="['order-status', order.order_status === 'returned' ? 'status-returned' : 'status-shipped']">
            ステータス: {{ order.order_status === 'returned' ? '返品済み' : '購入済み' }}
          </p>
          <p class="product-desc">購入日: {{ formatDate(order.order_date) }}</p>
          
          <button 
            v-if="order.order_status !== 'returned'" 
            class="return-button" 
            @click="returnProduct(order.order_id)">
            返品する
          </button>
          <button 
            v-else 
            class="return-button disabled-button" 
            disabled>
            返品済み
          </button>
        </div>
      </div>

      <h2>予約履歴（体験）</h2>
      <div class="card-list-container">
        <div v-if="userReservations.length===0" class="no-data">予約履歴はありません。</div>
        <div class="product-card list-item" v-for="res in userReservations" :key="res.reservation_id">
          <h3 class="product-name">予約ID: {{ res.reservation_id }}</h3>
          <p class="product-desc">体験名: {{ res.event_name }}</p>
          <p class="product-desc">場所: {{ res.location_name }}</p>
          <p class="product-desc">日程: {{ formatDateOnly(res.schedule_date) }}</p>
          <p class="product-desc">参加人数: {{ res.number_of_participants }}名</p>
          <p :class="['order-status', res.reservation_status === 'cancelled' ? 'status-returned' : 'status-reserved']">
            ステータス: {{ res.reservation_status === 'cancelled' ? 'キャンセル済み' : '予約済み' }}
          </p>
          <p class="product-desc">予約日: {{ formatDate(res.reservation_date) }}</p>
          </div>
      </div>
    </div>

  </main>

  <footer class="app-footer">
    <h1 class="footer-title">Gbamboo</h1>
  </footer>
</template>

<style>
/* ... (既存のスタイルは省略) ... */
.return-button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
  width: 100%;
  margin-top: 10px;
}
.return-button:hover:not(.disabled-button) {
  background: #c82333;
}
/* 予約キャンセルボタンに関連するスタイルは削除しました */
.disabled-button {
  opacity: 0.6;
  cursor: not-allowed;
}
.order-status {
  font-weight: bold;
  margin-bottom: 5px;
}
.status-returned {
  color: #dc3545;
}
.status-reserved {
  color: #28a745;
}
.status-shipped {
  color: #007bff;
}
/* ... (その他のスタイルは維持) ... */
</style>