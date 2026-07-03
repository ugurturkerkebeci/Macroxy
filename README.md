# 🟢 Macroxy

### Advanced Desktop Automation & Macro Recorder Framework

### Gelişmiş Masaüstü Otomasyon ve Makro Kaydedici Sistemi

<img src="https://raw.githubusercontent.com/ugurturkerkebeci/Macroxy/refs/heads/main/icon.ico">

<p align="center">
  <strong>Developed by Uğur Türker Kebeci (@ugurturkerkebeci)</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/HTML5%20%2F%20CSS3-Modern%20UI-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
</p>

<p align="center">
  <strong>Open-source desktop automation powered by Python and modern web technologies.</strong>
</p>

---

## 🌍 Languages / Diller

* 🇬🇧 [English Documentation](#-english)
* 🇹🇷 [Türkçe Dokümantasyon](#-türkçe)

---

# 🇬🇧 English

## 📖 Overview

**Macroxy** is an open-source desktop automation suite designed to record, analyze, customize, and replay mouse and keyboard interactions with pixel-perfect precision.

Built around a powerful Python automation engine and a responsive web dashboard, Macroxy helps users automate repetitive workflows, perform software QA testing, create productivity macros, and streamline complex desktop operations.

Its cyberpunk-inspired interface combines low-level operating system event hooking with a modern and intuitive control panel.

---

## ✨ Features

* 🎯 Pixel-perfect mouse and keyboard recording
* ⚡ Adjustable playback speed (0.5x → 2.0x → Instant)
* 🖱️ Optional hover movement filtering
* 🔁 Custom loop counts and infinite execution mode
* 💾 Persistent local macro library
* 📊 Real-time event telemetry console
* 🛡️ Global emergency stop protection
* 🌙 Modern cyberpunk-inspired interface

---

## 🏗️ Technology Stack

### Backend

* Python 3.10+
* pynput
* mouse
* keyboard

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)

### Communication Layer

* Real-time JSON event streams
* Bi-directional synchronization between the UI and automation engine

---

## 📦 Quick Start (.EXE)

Don't want to deal with source code, Python installations, dependencies, or terminal commands?

You can download the latest compiled version of **Macroxy** directly from the repository's **Releases** page.

1. Open the **Releases** section.
2. Download the latest **Macroxy.exe** or portable executable package.
3. Launch the executable and start using Macroxy immediately.

✅ No Python installation required
✅ No dependency management required
✅ Ready to use out of the box

> **Download:** `Releases → Latest Release → Macroxy.exe`

---

## 🚀 Developer Installation

### Clone Repository

```bash
git clone https://github.com/ugurturkerkebeci/macroxy.git
cd macroxy
```

### Create Virtual Environment

**Windows**

```bash
python -m venv venv
.\venv\Scripts\activate
```

**Linux/macOS**

```bash
python -m venv venv
source venv/bin/activate
```

### Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Run Application

```bash
python main.py
```

---

## 📚 Usage

### Record

Start recording:

```text
CTRL + ALT + R
```

Perform your desktop actions. Mouse movements, clicks, scrolling, and keyboard inputs are logged in real time.

### Stop Recording

```text
CTRL + ALT + R
```

or

```text
ESC
```

### Configure

Customize:

* Playback speed
* Delay calculations
* Hover recording
* Loop count

### Execute

Run the recorded macro and let Macroxy automate your workflow.

---

## 🛡️ Emergency Stop

Press:

```text
ESC
```

Macroxy immediately:

* Stops all background tasks
* Terminates active worker threads
* Safely returns to **STANDBY** mode

---

## 💾 Macro Library

Save automation sequences with custom names such as:

```text
DATA_PIPELINE_ALPHA
EMAIL_AUTOMATION
INSTAGRAM_FOLLOW_WORKFLOW
```

The local library allows you to:

* Save macros permanently
* Load existing profiles instantly
* View event statistics
* Delete outdated automation profiles

---

## 🤝 Contributing

Contributions, ideas, bug reports, and pull requests are always welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

# 🇹🇷 Türkçe

## 📖 Genel Bakış

**Macroxy**, fare ve klavye etkileşimlerini piksel hassasiyetinde kaydetmek, analiz etmek, özelleştirmek ve yeniden oynatmak için geliştirilmiş açık kaynaklı bir masaüstü otomasyon platformudur.

Güçlü Python otomasyon motoru ve modern web tabanlı kontrol paneli sayesinde tekrarlayan görevleri otomatikleştirmeyi, yazılım testleri yapmayı ve karmaşık iş akışlarını hızlandırmayı kolaylaştırır.

Siberpunk temalı arayüzü, işletim sistemi seviyesindeki olay yakalama mekanizmalarını modern ve kullanıcı dostu bir kontrol merkezi ile bir araya getirir.

---

## ✨ Özellikler

* 🎯 Piksel hassasiyetinde fare ve klavye kaydı
* ⚡ Ayarlanabilir oynatma hızı (0.5x → 2.0x → Instant)
* 🖱️ İsteğe bağlı fare hareketi filtreleme sistemi
* 🔁 Özel döngü sayısı ve sonsuz çalışma modu
* 💾 Kalıcı yerel makro kütüphanesi
* 📊 Gerçek zamanlı eylem konsolu
* 🛡️ Global acil durdurma mekanizması
* 🌙 Siberpunk temalı modern arayüz

---

## 🏗️ Teknoloji Yığını

### Arka Uç (Backend)

* Python 3.10+
* pynput
* mouse
* keyboard

### Ön Uç (Frontend)

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)

### İletişim Katmanı

* Gerçek zamanlı JSON veri akışları
* Arayüz ile otomasyon motoru arasında çift yönlü senkronizasyon

---

## 📦 Hızlı Başlangıç (.EXE)

Kaynak kodlarla, Python kurulumlarıyla, bağımlılıklarla veya terminal komutlarıyla uğraşmak istemiyor musunuz?

**Macroxy**'nin derlenmiş en güncel sürümünü doğrudan **Releases** bölümünden indirebilirsiniz.

1. Deponun **Releases** bölümüne gidin.
2. En güncel **Macroxy.exe** veya taşınabilir sürümü indirin.
3. Dosyayı çalıştırın ve Macroxy'yi hemen kullanmaya başlayın.

✅ Python kurulumu gerekmez
✅ Ek bağımlılık yüklemesi gerekmez
✅ İndirip anında kullanmaya başlayabilirsiniz

> **İndirme:** `Releases → Latest Release → Macroxy.exe`

---

## 🚀 Geliştirici Kurulumu

### Depoyu Klonlayın

```bash
git clone https://github.com/ugurturkerkebeci/macroxy.git
cd macroxy
```

### Sanal Ortam Oluşturun

**Windows**

```bash
python -m venv venv
.\venv\Scripts\activate
```

**Linux/macOS**

```bash
python -m venv venv
source venv/bin/activate
```

### Bağımlılıkları Yükleyin

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Projeyi Başlatın

```bash
python main.py
```

---

## 📚 Kullanım

### Kaydı Başlat

```text
CTRL + ALT + R
```

İstediğiniz masaüstü işlemlerini gerçekleştirin. Fare hareketleri, tıklamalar, kaydırmalar ve klavye girdileri gerçek zamanlı olarak kaydedilir.

### Kaydı Durdur

```text
CTRL + ALT + R
```

veya

```text
ESC
```

### Yapılandırın

* Oynatma hızı
* Bekleme hesaplamaları
* Fare hareketlerinin kaydı
* Döngü sayısı

### Çalıştırın

Makroyu başlatın ve Macroxy'nin işlemleri otomatik olarak gerçekleştirmesine izin verin.

---

## 🛡️ Acil Durdurma

```text
ESC
```

Macroxy:

* Tüm arka plan işlemlerini sonlandırır
* Aktif çalışan iş parçacıklarını durdurur
* Güvenli şekilde **BEKLEME (STANDBY)** moduna döner

---

## 💾 Makro Kütüphanesi

Makrolarınızı şu şekilde isimlendirerek kaydedebilirsiniz:

```text
DATA_PIPELINE_ALPHA
EMAIL_AUTOMATION
INSTAGRAM_FOLLOW_WORKFLOW
```

Yerel kütüphane ile:

* Makroları kalıcı olarak saklayabilirsiniz
* Kayıtlı profilleri anında yükleyebilirsiniz
* Olay istatistiklerini görüntüleyebilirsiniz
* Eski profilleri silebilirsiniz

---

## 🤝 Katkıda Bulunma

Katkılar, öneriler, hata bildirimleri ve Pull Request'ler her zaman memnuniyetle karşılanır.

1. Depoyu Fork'layın
2. Yeni bir özellik dalı oluşturun
3. Değişikliklerinizi Commit edin
4. Pull Request açın

---

## 📄 License / Lisans

Distributed under the MIT License.

---

<p align="center">
  Built with ❤️ by <strong>Uğur Türker Kebeci</strong><br>
  Independent Software Developer
</p>
