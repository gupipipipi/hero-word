<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// --- ステート ---
const items = ref([])
const locations = ref([])
const events = ref([])
const schedules = ref([])

const step = ref(1)
const selectedLocationId = ref(null)
const selectedEventId = ref(null)
const userId = ref('未ログイン')

const selectedPrefecture = ref('')
const selectedPriceRange = ref('')
const locationSortOrder = ref('desc') // 登録順: 'asc'=古い順, 'desc'=新着順
const priceSortOrder = ref('asc') // 価格順: 'asc'=安い順, 'desc'=高い順

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
    if (data && data.id) userId.value = data.id
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
  if(selectedPrefecture.value) list = list.filter(loc=>loc.address.startsWith(selectedPrefecture.value))
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
function goToProducts(){ window.location.href=''; }
function goToExperiences(){ window.location.href=''; }
function buyProduct(item){ window.location.href=''; }

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
  if(step.value===3) step.value=2
  else if(step.value===2) step.value=1
  if(step.value===1){ selectedLocationId.value=null; events.value=[] }
  if(step.value===2){ selectedEventId.value=null; schedules.value=[] }
}

function reserve(scheduleId){
  if(!userId.value || userId.value==='未ログイン'){ alert('ログイン必要'); return }
  axios.post('http://localhost:3000/api/buyevent',{
    schedule_id:scheduleId,
    user_id:userId.value,
    number_of_participants:1,
    status:'reserved'
  }).then(res=>alert(res.data.message||'予約完了')).catch(err=>{ console.error(err); alert('予約失敗') })
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
    </div>
  </header>

  <main class="slider-container">

    <!-- STEP1 -->
    <div v-if="step===1" class="section-wrapper">
      <!-- 商品 -->
      <h2>竹の商品</h2>

      <!-- 価格範囲＋価格順 -->
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
        <label>価格範囲:</label>
        <select v-model="selectedPriceRange">
          <option value="">すべて</option>
          <option value="under1000">1000円未満</option>
          <option value="1000to5000">1000〜5000円</option>
          <option value="above5000">5000円以上</option>
        </select>

        <label>価格順:</label>
        <select v-model="priceSortOrder">
          <option value="asc">安い順</option>
          <option value="desc">高い順</option>
        </select>
      </div>

      <div class="card-slider">
        <div v-if="limitedItems.length===0" class="no-data">該当なし</div>
        <div class="product-card" v-for="item in limitedItems" :key="item.item_name">
          <img src="/images/vite.svg" :alt="item.item_name" class="product-image" />
          <h3 class="product-name">{{ item.item_name }}</h3>
          <p class="product-price">¥{{ Number(item.price).toLocaleString() }}</p>
          <p class="product-desc">登録日: {{ formatDate(item.created_at) }}</p>
          <button class="buy-button" @click="buyProduct(item)">購入する</button>
        </div>
      </div>
      <div v-if="filteredItems.length>3" class="more-btn-container">
        <button class="more-button" @click="toggleShowItems">{{ showAllItems ? '閉じる' : 'もっと見る' }}</button>
      </div>

      <!-- 体験 -->
      <h2>竹の体験</h2>

      <!-- 地域＋登録順 -->
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <label for="prefecture-select">地域:</label>
        <select id="prefecture-select" v-model="selectedPrefecture">
          <option value="">すべて</option>
          <option v-for="pref in prefectures" :key="pref">{{ pref }}</option>
        </select>

        <label for="location-sort">登録順:</label>
        <select id="location-sort" v-model="locationSortOrder">
          <option value="asc">古い順</option>
          <option value="desc">新着順</option>
        </select>
      </div>

      <div class="card-slider">
        <div v-if="limitedLocations.length===0" class="no-data">該当なし</div>
        <div class="product-card" v-for="loc in limitedLocations" :key="loc.location_id">
          <img :src="defaultImage" :alt="loc.name" class="product-image" />
          <h3 class="product-name">{{ loc.name }}</h3>
          <p class="product-name">{{ loc.address }}</p>
          <p class="product-desc">登録日: {{ formatDate(loc.created_at) }}</p>
          <button class="buy-button" @click="selectLocation(loc.location_id)">体験を見る</button>
        </div>
      </div>
      <div v-if="filteredLocations.length>3" class="more-btn-container">
        <button class="more-button" @click="toggleShowLocations">{{ showAllLocations ? '閉じる' : 'もっと見る' }}</button>
      </div>
    </div>

    <!-- STEP2 -->
    <div v-if="step===2" class="section-wrapper">
      <button class="go-back-button" @click="goBack">← 戻る</button>

      <div class="card-slider">
        <div v-if="sortedEvents.length===0" class="no-data">該当なし</div>
        <div class="product-card" v-for="ev in limitedEvents" :key="ev.event_id">
          <img :src="ev.imagefilename?`/images/${ev.imagefilename}`:defaultImage" :alt="ev.event_name" class="product-image" />
          <h3 class="product-name">{{ ev.event_name }}</h3>
          <p class="product-desc">{{ ev.event_description }}</p>
          <p class="product-price">¥{{ Number(ev.price).toLocaleString() }}</p>
          <button class="buy-button" @click="selectEvent(ev.event_id)">日程を見る</button>
        </div>
      </div>
      <div v-if="sortedEvents.length>3" class="more-btn-container">
        <button class="more-button" @click="toggleShowEvents">{{ showAllEvents ? '閉じる' : 'もっと見る' }}</button>
      </div>
    </div>

    <!-- STEP3 -->
    <div v-if="step===3" class="section-wrapper">
      <button class="go-back-button" @click="goBack">← 戻る</button>

      <div class="card-slider">
        <div v-if="sortedSchedules.length===0" class="no-data">該当なし</div>
        <div class="product-card" v-for="sch in limitedSchedules" :key="sch.schedule_id">
          <img :src="defaultImage" :alt="`schedule ${sch.schedule_id}`" class="product-image" />
          <h3 class="product-name">{{ formatDateOnly(sch.event_date) }}</h3>
          <p class="product-name">定員: {{ sch.capacity }}</p>
          <p class="product-desc">スケジュールID: {{ sch.schedule_id }}</p>
          <button class="buy-button" @click="reserve(sch.schedule_id)">予約する</button>
        </div>
      </div>
      <div v-if="sortedSchedules.length>3" class="more-btn-container">
        <button class="more-button" @click="toggleShowSchedules">{{ showAllSchedules ? '閉じる' : 'もっと見る' }}</button>
      </div>
    </div>

  </main>

  <footer class="app-footer">
    <h1 class="footer-title">Gbamboo</h1>
  </footer>
</template>

<style>
body{
  margin:0;
  font-family:sans-serif;
}
.user-id{
  text-align:right;
  padding:8px 20px;
  font-weight:bold;
}
.slider-container{
  display:flex;
  flex-direction:column;
  align-items:center;
  width:100%;
  padding:20px;
  box-sizing:border-box;
}
.section-wrapper{
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  position: relative;
}
.card-slider{
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  gap:20px;
  margin:10px 0;
}
.product-card {
  width: 220px;
  min-height:280px;
  background:#fff;
  border-radius:10px;
  text-align:center;
  box-shadow:0 2px 6px rgba(0,0,0,0.1);
  padding:10px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}
.product-image{
  width:100%;
  height:140px;
  object-fit:cover;
  border-radius:10px 10px 0 0;
}
.product-name{
  font-weight:bold;
  margin:10px 0 5px;
}
.product-desc{
  font-size:12px;
  color:#666;
  margin-bottom:6px;
  min-height:36px;
}
.product-price{
  color:#007bff;
  font-weight:bold;
  margin-bottom:10px;
}
.buy-button{
  background:#28a745;
  color:white;
  border:none;
  padding:8px 14px;
  border-radius:6px;
  cursor:pointer;
  transition:0.3s;
}
.buy-button:hover{
  background:#218838;
}
.more-button{
  background:#007bff;
  color:white;
  border:none;
  padding:8px 16px;
  border-radius:6px;
  cursor:pointer;
  transition:0.3s;
}
.more-button:hover{
  background:#0056b3;
}
.more-btn-container{
  width:100%;
  display:flex;
  justify-content:flex-end;
  margin:10px 0 20px 0;
}
.go-back-button{
  position: absolute;
  top: 10px;
  right: 10px;
  background: #007bff;
  color:white;
  border:none;
  padding:10px 16px;
  border-radius:8px;
  cursor:pointer;
  z-index:10;
}
.go-back-button:hover{
  background:#0056b3;
}
.app-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:10px 20px;
  background:#f8f8f8;
  box-shadow:0 2px 4px rgba(0,0,0,0.1);
}
.header-icon{
  width:40px;
  height:40px;
}
.header-title{
  margin:0;
  text-align:center;
  flex:1;
  font-weight:bold;
  font-size:20px;
}
.header-buttons{
  display:flex;
  gap:10px;
}
.header-buttons button{
  padding:6px 12px;
  cursor:pointer;
}
.app-footer{
  display:flex;
  justify-content:center;
  align-items:center;
  padding:10px 20px;
  background:#989090ff;
  box-shadow:0 2px 4px rgba(0,0,0,0.1);
}
.footer-title{
  color:#eaeff3ff;
  margin:0;
  font-size:10px;
  font-weight:bold;
}
.no-data{
  flex:0 0 100%;
  text-align:center;
  font-size:18px;
  font-weight:bold;
  color:#ff4d4f;
}
</style>