<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { onMounted } from 'vue';
import { checkAuth } from './utils/auth';

onMounted(() => {
  checkAuth();
});

// リアクティブなデータ
const itemname = ref('');
const selectedfile = ref(null);
const description = ref('');
const price = ref('');
const message = ref('');

// ファイル選択時のイベントハンドラ
const onFileChange = (event) => {
  selectedfile.value = event.target.files[0];
}

// 登録処理
const registerItem = async () => {
  // ファイルアップロードにはjsonじゃなくてFormDataが必要
  const formData = new FormData();
  formData.append('itemname', itemname.value);
  formData.append('itemimage', selectedfile.value);
  formData.append('description', description.value);
  formData.append('price', price.value);

  try {
    const response = await axios.post('http://localhost:3000/api/register_items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 書かなくてもいいらしい
        'Authorization': 'Bearer ' + localStorage.getItem('user-token') // リクエストヘッダーにトークンを追加
      }
    });
    // 登録成功時のメッセージ
    message.value = response.data.message;

  } catch (error) {
    // エラー時のメッセージ
    message.value = error.response.data.message || '登録に失敗しました。';
  }
};
</script>

<template>
  <div class="register-container">
    <h2>商品登録</h2>
    <form @submit.prevent="registerItem">
      <div class="form-group">
        <label for="itemname">商品名</label>
        <input type="text" id="itemname" v-model="itemname" required>
      </div>
      <div class="form-group">
        <label for="itemimage">商品画像</label>
        <input type="file" id="itemimage" @change="onFileChange" required>
      </div>
      <div class="form-group">
        <label for="description">商品説明</label>
        <textarea id="description" v-model="description" rows="8" maxlength="200" placeholder="200文字以内" required></textarea>
      </div>
      <div class="form-group">
        <label for="price">価格</label>
        <input type="number" id="price" v-model="price" required>
      </div>
      <button type="submit">登録</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.form-group {
  margin-bottom: 15px;
  text-align: left;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
textarea {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>