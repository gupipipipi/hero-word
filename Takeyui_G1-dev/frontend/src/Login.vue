<script setup>
import { ref } from 'vue';
import axios from 'axios';

// リアクティブなデータ
const email = ref('');
const password = ref('');
const message = ref('');

// ログイン処理
const login = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/login', {
      email: email.value,
      password: password.value
    });
    // ログイン成功時のメッセージ
    message.value = response.data.message;
    
    const token = response.data.token;
    localStorage.setItem('user-token', token);
    

    // ログイン後のページにリダイレクト
    window.location.href = './usermain.html';

  } catch (error) {
    // エラー時のメッセージ
    message.value = error.response.data.message || 'ログインに失敗しました。';
  }
};
</script>

<template>
  <div class="register-container">
    <h2>ログイン</h2>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="email">メールアドレス</label>
        <input type="email" id="email" v-model="email" required>
      </div>
      <div class="form-group">
        <label for="password">パスワード</label>
        <input type="password" id="password" v-model="password" required>
      </div>
      <button type="submit">ログイン</button>
    </form>
    <p v-if="message">{{ message }}</p>
    <a href="./register.html">アカウントの新規登録はこちら</a>
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