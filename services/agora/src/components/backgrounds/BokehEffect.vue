<!-- 
Copyright (c) 2024 by Louis Hoebregts (https://codepen.io/Mamboleoo/pen/BxMQYQ)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->
<template>
  <div class="background">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>

<style scoped>
@keyframes move {
  100% {
    transform: translate3d(0, 0, 1px) rotate(360deg);
  }
}

.background {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background: #3E1E68;
  overflow: hidden;
}

.background span {
  width: 20vmin;
  height: 20vmin;
  border-radius: 20vmin;
  backface-visibility: hidden;
  position: absolute;
  animation: move;
  animation-duration: 1;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}


.background span:nth-child(0) {
  color: #FFACAC;
  top: 9%;
  left: 45%;
  animation-duration: 100s;
  animation-delay: -470s;
  transform-origin: -9vw 17vh;
  box-shadow: 40vmin 0 5.2570757557153796vmin currentColor;
}

.background span:nth-child(1) {
  color: #E45A84;
  top: 40%;
  left: 49%;
  animation-duration: 326s;
  animation-delay: -57s;
  transform-origin: 25vw -16vh;
  box-shadow: -40vmin 0 5.60677832991616vmin currentColor;
}

.background span:nth-child(2) {
  color: #583C87;
  top: 20%;
  left: 8%;
  animation-duration: 447s;
  animation-delay: -449s;
  transform-origin: -6vw -19vh;
  box-shadow: 40vmin 0 5.962102831102868vmin currentColor;
}

.background span:nth-child(3) {
  color: #E45A84;
  top: 54%;
  left: 28%;
  animation-duration: 174s;
  animation-delay: -300s;
  transform-origin: 24vw -15vh;
  box-shadow: 40vmin 0 5.527454522820155vmin currentColor;
}

.background span:nth-child(4) {
  color: #583C87;
  top: 73%;
  left: 35%;
  animation-duration: 43s;
  animation-delay: -129s;
  transform-origin: 18vw -10vh;
  box-shadow: 40vmin 0 5.182240173854295vmin currentColor;
}

.background span:nth-child(5) {
  color: #FFACAC;
  top: 64%;
  left: 72%;
  animation-duration: 179s;
  animation-delay: -122s;
  transform-origin: 19vw -5vh;
  box-shadow: 40vmin 0 5.61357869410924vmin currentColor;
}

.background span:nth-child(6) {
  color: #E45A84;
  top: 75%;
  left: 24%;
  animation-duration: 286s;
  animation-delay: -179s;
  transform-origin: -6vw -21vh;
  box-shadow: -40vmin 0 5.61038445250051vmin currentColor;
}

.background span:nth-child(7) {
  color: #583C87;
  top: 97%;
  left: 96%;
  animation-duration: 54s;
  animation-delay: -308s;
  transform-origin: 4vw 9vh;
  box-shadow: 40vmin 0 5.374429104386805vmin currentColor;
}

.background span:nth-child(8) {
  color: #583C87;
  top: 17%;
  left: 5%;
  animation-duration: 297s;
  animation-delay: -307s;
  transform-origin: -19vw -10vh;
  box-shadow: -40vmin 0 5.607781496480233vmin currentColor;
}

.background span:nth-child(9) {
  color: #583C87;
  top: 49%;
  left: 52%;
  animation-duration: 425s;
  animation-delay: -389s;
  transform-origin: 12vw 9vh;
  box-shadow: -40vmin 0 5.263743003048308vmin currentColor;
}

.background span:nth-child(10) {
  color: #583C87;
  top: 64%;
  left: 95%;
  animation-duration: 321s;
  animation-delay: -36s;
  transform-origin: -9vw 24vh;
  box-shadow: -40vmin 0 5.90993612650314vmin currentColor;
}

.background span:nth-child(11) {
  color: #FFACAC;
  top: 25%;
  left: 10%;
  animation-duration: 452s;
  animation-delay: -41s;
  transform-origin: 3vw -15vh;
  box-shadow: -40vmin 0 5.062659663095685vmin currentColor;
}

.background span:nth-child(12) {
  color: #FFACAC;
  top: 79%;
  left: 81%;
  animation-duration: 174s;
  animation-delay: -33s;
  transform-origin: 5vw 17vh;
  box-shadow: -40vmin 0 5.731941663648268vmin currentColor;
}

.background span:nth-child(13) {
  color: #583C87;
  top: 97%;
  left: 20%;
  animation-duration: 400s;
  animation-delay: -217s;
  transform-origin: 7vw -22vh;
  box-shadow: 40vmin 0 5.774552913360145vmin currentColor;
}

.background span:nth-child(14) {
  color: #FFACAC;
  top: 3%;
  left: 100%;
  animation-duration: 258s;
  animation-delay: -62s;
  transform-origin: -4vw -18vh;
  box-shadow: -40vmin 0 5.796614351252321vmin currentColor;
}

.background span:nth-child(15) {
  color: #FFACAC;
  top: 1%;
  left: 34%;
  animation-duration: 277s;
  animation-delay: -384s;
  transform-origin: -22vw 21vh;
  box-shadow: -40vmin 0 5.810565421330751vmin currentColor;
}

.background span:nth-child(16) {
  color: #FFACAC;
  top: 65%;
  left: 43%;
  animation-duration: 63s;
  animation-delay: -181s;
  transform-origin: -2vw 16vh;
  box-shadow: -40vmin 0 5.551789797524629vmin currentColor;
}

.background span:nth-child(17) {
  color: #FFACAC;
  top: 26%;
  left: 90%;
  animation-duration: 338s;
  animation-delay: -396s;
  transform-origin: 18vw 10vh;
  box-shadow: -40vmin 0 5.658980672014578vmin currentColor;
}

.background span:nth-child(18) {
  color: #583C87;
  top: 44%;
  left: 83%;
  animation-duration: 111s;
  animation-delay: -106s;
  transform-origin: 18vw 2vh;
  box-shadow: -40vmin 0 5.023855953961145vmin currentColor;
}

.background span:nth-child(19) {
  color: #583C87;
  top: 51%;
  left: 1%;
  animation-duration: 311s;
  animation-delay: -452s;
  transform-origin: 17vw -24vh;
  box-shadow: -40vmin 0 5.3765085929693335vmin currentColor;
}
</style>