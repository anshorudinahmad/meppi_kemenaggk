import { AspekInfo, ButirInstrumen } from '../types';

export const ASPEK_LIST: AspekInfo[] = [
  {
    id: 1,
    nama: "Kebijakan Pelayanan",
    bobot: 12,
    skorMaks: 12,
    keterangan: "Penetapan Standar Pelayanan (SP), Forum Konsultasi Publik, dan Publikasi Maklumat Pelayanan"
  },
  {
    id: 2,
    nama: "Profesionalisme SDM",
    bobot: 10,
    skorMaks: 12,
    keterangan: "Kompetensi petugas Front Office/PTSP, kode etik & reward-punishment, serta kelengkapan atribut layanan"
  },
  {
    id: 3,
    nama: "Sarana dan Prasarana",
    bobot: 15,
    skorMaks: 16,
    keterangan: "Kenyamanan loket & ruang tunggu, fasilitas penunjang, sarpras ramah disabilitas/kelompok rentan, dan K3/signage"
  },
  {
    id: 4,
    nama: "Sistem Informasi Pelayanan Publik",
    bobot: 12,
    skorMaks: 12,
    keterangan: "Keterbukaan informasi via website/medsos, digitalisasi layanan mandiri, dan kemudahan akses info di kantor"
  },
  {
    id: 5,
    nama: "Konsultasi dan Pengaduan",
    bobot: 8,
    skorMaks: 12,
    keterangan: "Kanal konsultasi/pengaduan masyarakat, petugas & SOP penanganan, serta tindak lanjut penyelesaian aduan"
  },
  {
    id: 6,
    nama: "Inovasi Pelayanan",
    bobot: 8,
    skorMaks: 8,
    keterangan: "Kebaruan program inovasi pelayanan dan dampak nyata serta keberlanjutannya bagi masyarakat"
  },
  {
    id: 7,
    nama: "Survei Masyarakat & Anti-Korupsi",
    bobot: 15,
    skorMaks: 16,
    keterangan: "Pelaksanaan SKM, survei SPAK, transparansi tarif Rp0/PNBP, kampanye anti-gratifikasi, dan mitigasi risiko internal"
  },
  {
    id: 8,
    nama: "Video Praktik Pelayanan",
    bobot: 20,
    skorMaks: 12,
    keterangan: "Video praktik riil 3-5 menit: alur & transparansi, penerapan 5S/hospitality, serta edukasi anti-gratifikasi & SKM"
  }
];

export const INSTRUMEN_LIST: ButirInstrumen[] = [
  // --- ASPEK 1: KEBIJAKAN PELAYANAN (Bobot: 12%) ---
  {
    code: "1.1",
    aspekId: 1,
    judul: "Ketersediaan dan Penetapan Standar Pelayanan (SP)",
    pertanyaan: "Apakah unit kerja telah menyusun dan menetapkan Standar Pelayanan (SP) untuk seluruh jenis layanan yang diberikan?",
    buktiDukung: "PDF SK Penetapan Standar Pelayanan dan dokumen evaluasi/revisi SP.",
    opsi: [
      "Belum memiliki dokumen SP.",
      "Memiliki draf SP namun belum disahkan melalui SK Kepala Unit.",
      "SP telah ditetapkan melalui SK, namun belum mencakup seluruh jenis layanan atau belum memuat 14 komponen standar.",
      "SP telah ditetapkan melalui SK, mencakup seluruh jenis layanan, dan memenuhi komponen standar (persyaratan, alur, waktu, biaya, produk, pengaduan).",
      "Memenuhi skor 3, ditambah adanya dokumen peninjauan ulang (evaluasi berkala) terhadap SP minimal 1 kali dalam setahun."
    ]
  },
  {
    code: "1.2",
    aspekId: 1,
    judul: "Pelibatan Masyarakat dalam Penyusunan Standar Pelayanan",
    pertanyaan: "Apakah dalam menyusun/mengevaluasi Standar Pelayanan melibatkan unsur masyarakat atau pemangku kepentingan (Komite Madrasah, Tokoh Masyarakat, Pengguna Layanan)?",
    buktiDukung: "PDF Berita Acara Forum Konsultasi Publik (FKP), undangan, daftar hadir, dan foto kegiatan.",
    opsi: [
      "Penyusunan SP dilakukan sepihak tanpa melibatkan masyarakat.",
      "Melibatkan pihak internal unit kerja saja.",
      "Melibatkan masyarakat/komite namun tidak terdokumentasi secara formal.",
      "Melibatkan unsur masyarakat/komite dalam Forum Konsultasi Publik (FKP) dan dibuktikan dengan Berita Acara.",
      "Memenuhi skor 3, dilengkapi dokumentasi lengkap (undangan, daftar hadir, notulensi masukan masyarakat, dan bukti tindak lanjut masukan)."
    ]
  },
  {
    code: "1.3",
    aspekId: 1,
    judul: "Publikasi Standar Pelayanan dan Maklumat Pelayanan",
    pertanyaan: "Sejauh mana Standar Pelayanan dan Maklumat Pelayanan dipublikasikan kepada masyarakat?",
    buktiDukung: "Kolase foto pemasangan Maklumat & SP di ruang layanan serta screenshot publikasi di media sosial/website.",
    opsi: [
      "Tidak dipublikasikan.",
      "Hanya disimpan dalam bentuk dokumen arsip di kantor.",
      "Dipajang di ruang pelayanan, namun ukuran/posisinya kurang terbaca jelas oleh pemohon.",
      "Dipajang dengan jelas di ruang tunggu/loket layanan dalam bentuk poster/banner/standing banner yang mudah dibaca.",
      "Dipajang dengan jelas di ruang pelayanan DAN dipublikasikan secara digital melalui media sosial/website/brosur digital (QR Code)."
    ]
  },

  // --- ASPEK 2: PROFESIONALISME SDM (Bobot: 10%) ---
  {
    code: "2.1",
    aspekId: 2,
    judul: "Penetapan dan Kompetensi Petugas Pelayanan (Front Office/PTSP)",
    pertanyaan: "Apakah terdapat penetapan khusus petugas pelayanan beserta upaya peningkatan kompetensinya?",
    buktiDukung: "PDF SK Petugas Layanan/PTSP dan dokumentasi/sertifikat pembinaan pelayanan prima.",
    opsi: [
      "Tidak ada petugas khusus pelayanan.",
      "Ada petugas yang berjaga, namun belum ditetapkan melalui SK Kepala Unit.",
      "Petugas pelayanan telah ditetapkan melalui SK pembagian tugas yang jelas.",
      "Petugas ditetapkan melalui SK dan pernah mengikuti pembinaan/sosialisasi internal terkait Service Excellence (Pelayanan Prima).",
      "Memenuhi skor 3, ditambah petugas memiliki sertifikat pelatihan pelayanan publik/kehumasan/pendampingan disabilitas (bahasa isyarat dasar)."
    ]
  },
  {
    code: "2.2",
    aspekId: 2,
    judul: "Kode Etik dan Aturan Perilaku Petugas Layanan",
    pertanyaan: "Apakah unit kerja memiliki aturan kode etik serta mekanisme penghargaan dan sanksi (reward & punishment) bagi petugas layanan?",
    buktiDukung: "PDF SK Kode Etik, foto pemasangan budaya kerja, dan SK/dokumentasi pemberian reward petugas terbaik.",
    opsi: [
      "Belum memiliki aturan kode etik petugas layanan.",
      "Mengacu pada aturan disiplin ASN secara umum tanpa penjabaran khusus untuk petugas layanan.",
      "Memiliki dokumen Kode Etik Petugas Pelayanan yang ditetapkan Kepala Unit.",
      "Memiliki Kode Etik yang disosialisasikan kepada seluruh staf serta terpasang pengingat budaya kerja (5S / 5 Budaya Kerja Kemenag) di area kerja.",
      "Memenuhi skor 3, ditambah adanya pelaksanaan pemberian penghargaan (Petugas Layanan Terbaik) secara berkala dan mekanisme teguran bagi pelanggar."
    ]
  },
  {
    code: "2.3",
    aspekId: 2,
    judul: "Kerapian dan Kelengkapan Atribut Petugas Layanan",
    pertanyaan: "Bagaimana kelengkapan atribut identitas petugas saat memberikan pelayanan?",
    buktiDukung: "Foto close-up dan medium-shot petugas saat bertugas di loket layanan.",
    opsi: [
      "Petugas berpakaian bebas/tidak rapi dan tanpa tanda pengenal.",
      "Mengenakan seragam kerja, namun tanpa tanda pengenal (ID Card / Name Tag).",
      "Mengenakan seragam sesuai ketentuan hari kerja dan memakai tanda pengenal.",
      "Mengenakan seragam rapi, tanda pengenal, serta terdapat papan nama petugas/identitas loket di meja pelayanan.",
      "Memenuhi skor 3, ditambah adanya atribut khusus petugas Front Office (seperti selempang Duta Layanan, rompi khusus PTSP, atau pin Melayani dengan Hati / Anti Gratifikasi)."
    ]
  },

  // --- ASPEK 3: SARANA DAN PRASARANA (Bobot: 15%) ---
  {
    code: "3.1",
    aspekId: 3,
    judul: "Kenyamanan Loket dan Ruang Tunggu Pelayanan",
    pertanyaan: "Bagaimana kondisi fasilitas meja loket dan ruang tunggu bagi pengguna layanan?",
    buktiDukung: "Kolase foto ruang tunggu, loket pelayanan, fasilitas pendingin ruangan, dan mesin/nomor antrean.",
    opsi: [
      "Tidak ada ruang tunggu khusus (pemohon menunggu di luar/berdiri).",
      "Tersedia kursi tunggu dan meja layanan, namun kondisi kurang terawat/sempit.",
      "Ruang tunggu bersih, memiliki tempat duduk memadai, dan sirkulasi udara/pencahayaan baik.",
      "Ruang tunggu bersih, nyaman, ber-AC/kipas angin memadai, dilengkapi sistem antrean (manual/digital), tempat sampah, dan air minum.",
      "Memenuhi skor 3, ditambah desain meja layanan ergonomis (tanpa sekat penghalang tinggi yang kaku), tersedia charging station, Wi-Fi gratis bagi pemohon, dan jadwal ceklis kebersihan rutin."
    ]
  },
  {
    code: "3.2",
    aspekId: 3,
    judul: "Ketersediaan Fasilitas Penunjang Layanan",
    pertanyaan: "Apa saja fasilitas penunjang yang tersedia bagi pengguna layanan di lingkungan unit kerja?",
    buktiDukung: "Kolase foto berlabel untuk parkir, toilet pengguna layanan, mushola, pojok baca, dan area bermain anak.",
    opsi: [
      "Tidak tersedia fasilitas penunjang.",
      "Hanya tersedia tempat parkir seadanya.",
      "Tersedia tempat parkir yang tertata dan toilet pengguna layanan yang bersih.",
      "Tersedia parkir tertata, toilet bersih terpisah (pria/wanita), tempat ibadah (mushola) yang layak, dan pojok baca/bahan bacaan.",
      "Memenuhi skor 3, dilengkapi area ramah anak (pojok bermain anak) dan fasilitas minuman mandiri gratis (free flow water/tea)."
    ]
  },
  {
    code: "3.3",
    aspekId: 3,
    judul: "Sarana Prasarana Ramah Kelompok Rentan / Penyandang Disabilitas",
    pertanyaan: "Sejauh mana ketersediaan fasilitas ramah kelompok rentan (difabel, lansia, ibu hamil/menyusui)?",
    buktiDukung: "Kolase foto seluruh fasilitas ramah kelompok rentan dan difabel (ramp, kursi roda, ruang laktasi, toilet difabel, guiding block).",
    opsi: [
      "Belum tersedia fasilitas khusus kelompok rentan.",
      "Tersedia 1-2 fasilitas dasar (misal: hanya jalur landai/ramp atau kursi roda).",
      "Tersedia 3-4 fasilitas (jalur landai/ramp, kursi roda/tongkat, kursi tunggu prioritas, dan parkir khusus).",
      "Tersedia lengkap (poin 2 ditambah ruang laktasi/menyusui yang tertutup dan toilet khusus ramah difabel dengan handrail).",
      "Memenuhi skor 3, ditambah guiding block (jalur pemandu tunanetra), loket khusus prioritas, serta alat bantu komunikasi (informasi Braille/audio/video bahasa isyarat/alat bantu dengar)."
    ]
  },
  {
    code: "3.4",
    aspekId: 3,
    judul: "Keamanan, Keselamatan, dan Penunjuk Arah (Signage)",
    pertanyaan: "Apakah tersedia petunjuk arah ruangan yang jelas serta perlengkapan keselamatan gedung?",
    buktiDukung: "Kolase foto rambu penunjuk arah, APAR (terlihat masa berlaku), jalur evakuasi, titik kumpul, P3K, dan CCTV.",
    opsi: [
      "Tidak ada rambu petunjuk arah maupun alat keselamatan.",
      "Ada papan nama ruangan, namun belum ada petunjuk arah alur layanan dan alat keselamatan.",
      "Tersedia papan petunjuk arah ruangan (loket, toilet, mushola) dan minimal 1 Alat Pemadam Api Ringan (APAR).",
      "Tersedia rambu petunjuk arah yang jelas, APAR yang masih aktif (tidak kedaluwarsa), jalur evakuasi, dan titik kumpul.",
      "Memenuhi skor 3, dilengkapi kamera pengawas (CCTV) aktif di area layanan dan kotak P3K lengkap di dekat loket pelayanan."
    ]
  },

  // --- ASPEK 4: SISTEM INFORMASI PELAYANAN PUBLIK / SIPP (Bobot: 12%) ---
  {
    code: "4.1",
    aspekId: 4,
    judul: "Keterbukaan Informasi melalui Media Digital (Website / Media Sosial)",
    pertanyaan: "Apakah unit kerja memanfaatkan media digital resmi untuk menyebarkan informasi pelayanan kepada masyarakat?",
    buktiDukung: "Screenshot profil media sosial/website yang memuat informasi layanan beserta tautan aktif.",
    opsi: [
      "Tidak memiliki website maupun akun media sosial resmi.",
      "Memiliki akun media sosial/website, namun tidak aktif (terakhir unggah lebih dari 3 bulan lalu).",
      "Media sosial/website aktif mengunggah kegiatan seremonial, namun belum memuat informasi standar pelayanan.",
      "Media sosial/website aktif dan memuat informasi persyaratan, alur, jam layanan, serta tarif layanan (misal di Highlight IG atau menu Web).",
      "Memenuhi skor 3, dikelola secara rutin (minimal update mingguan), desain informatif, serta mencantumkan tautan terintegrasi (Linktree/portal satu pintu)."
    ]
  },
  {
    code: "4.2",
    aspekId: 4,
    judul: "Digitalisasi Proses Pelayanan (Layanan Berbasis Elektronik)",
    pertanyaan: "Apakah unit kerja telah menerapkan inovasi layanan digital untuk mempermudah pemohon tanpa harus datang berulang kali ke kantor?",
    buktiDukung: "Screenshot antarmuka layanan digital/PTSP Online/WA Bot dan tautan aksesnya.",
    opsi: [
      "Seluruh layanan masih 100% manual/tatap muka.",
      "Hanya menggunakan aplikasi wajib pusat (SIMKAH / EMIS / PDUM) tanpa kanal layanan mandiri bagi masyarakat.",
      "Menyediakan layanan konsultasi atau pengiriman berkas awal melalui WhatsApp.",
      "Memiliki formulir permohonan layanan online (Google Form/PTSP Online/Web) untuk pendaftaran, legalisir online, mutasi, atau permohonan rekomendasi.",
      "Memiliki sistem layanan digital terpadu (PTSP Online/WhatsApp Auto-Reply Bot) yang dilengkapi fitur pelacakan status berkas (tracking layanan) atau pengiriman produk layanan digital (TTE/PDF)."
    ]
  },
  {
    code: "4.3",
    aspekId: 4,
    judul: "Kemudahan Akses Informasi di Ruang Layanan",
    pertanyaan: "Bagaimana cara pemohon mendapatkan informasi layanan secara mandiri saat berada di kantor?",
    buktiDukung: "Foto poster QR Code katalog layanan, brosur cetak, dan layar monitor informasi di ruang tunggu.",
    opsi: [
      "Pemohon harus bertanya langsung ke petugas untuk semua informasi.",
      "Tersedia brosur/pamflet kertas dalam jumlah terbatas.",
      "Tersedia poster/banner alur layanan dan brosur cetak yang tertata rapi.",
      "Tersedia poster alur layanan, brosur cetak, serta Katalog Layanan Digital (QR Code) yang bisa dipindai pemohon menggunakan HP masing-masing.",
      "Memenuhi skor 3, ditambah adanya layar monitor informasi (TV Display/Kiosk Informasi) yang menampilkan profil layanan, alur, atau jadwal layanan secara visual."
    ]
  },

  // --- ASPEK 5: KONSULTASI DAN PENGADUAN (Bobot: 8%) ---
  {
    code: "5.1",
    aspekId: 5,
    judul: "Ketersediaan Kanal Konsultasi dan Pengaduan Masyarakat",
    pertanyaan: "Kanal apa saja yang disediakan unit kerja bagi masyarakat yang ingin berkonsultasi atau menyampaikan keluhan/pengaduan?",
    buktiDukung: "Foto publikasi nomor/QR pengaduan, kotak saran, dan ruang konsultasi.",
    opsi: [
      "Tidak tersedia kanal pengaduan.",
      "Hanya tersedia kotak saran fisik di kantor.",
      "Tersedia kotak saran fisik dan nomor telepon/WhatsApp pengaduan.",
      "Tersedia kanal pengaduan beragam (Kotak Saran, WA Hotline, Google Form/QR Code Pengaduan, Medsos) yang dipublikasikan secara jelas di ruang layanan.",
      "Memenuhi skor 3, ditambah adanya meja/ruang konsultasi khusus yang menjaga privasi pemohon serta informasi terhubung ke SP4N-LAPOR!."
    ]
  },
  {
    code: "5.2",
    aspekId: 5,
    judul: "Petugas dan Prosedur (SOP) Pengelolaan Pengaduan",
    pertanyaan: "Apakah terdapat petugas khusus dan SOP yang mengatur tata cara penanganan pengaduan?",
    buktiDukung: "PDF SK Petugas Pengaduan, SOP Pengaduan, dan foto alur pengaduan di ruang layanan.",
    opsi: [
      "Tidak ada petugas maupun SOP pengaduan.",
      "Pengaduan ditangani secara insidental tanpa penunjukan petugas resmi.",
      "Terdapat SK penunjukan petugas pengelola pengaduan.",
      "Terdapat SK petugas pengelola pengaduan DAN SOP Penanganan Pengaduan yang menetapkan batas waktu respon penyelesaian.",
      "Memenuhi skor 3, disertai poster alur penanganan pengaduan yang dipajang di ruang publik sehingga masyarakat tahu mekanisme pemrosesannya."
    ]
  },
  {
    code: "5.3",
    aspekId: 5,
    judul: "Dokumentasi dan Tindak Lanjut Pengaduan",
    pertanyaan: "Bagaimana pencatatan dan penyelesaian atas konsultasi atau pengaduan yang masuk?",
    buktiDukung: "PDF Rekapitulasi Register Pengaduan, bukti tindak lanjut (atau laporan nihil berkala), dan bukti publikasi.",
    opsi: [
      "Tidak ada buku/rekapitulasi pencatatan pengaduan.",
      "Memiliki buku register pengaduan, namun kosong tanpa laporan berkala.",
      "Memiliki rekapitulasi konsultasi/pengaduan berkala (termasuk jika laporan pengaduan nihil).",
      "Seluruh pengaduan/masukan yang masuk dicatat dan disertai bukti tindak lanjut penyelesaiannya (before-after).",
      "Memenuhi skor 3, serta rekapitulasi pengaduan dan tindak lanjutnya dipublikasikan secara berkala sebagai bentuk transparansi kepada publik."
    ]
  },

  // --- ASPEK 6: INOVASI PELAYANAN (Bobot: 8%) ---
  {
    code: "6.1",
    aspekId: 6,
    judul: "Ketersediaan dan Kebaruan Inovasi Pelayanan Publik",
    pertanyaan: "Apakah unit kerja memiliki program inovasi pelayanan untuk memangkas birokrasi, mempercepat waktu, atau menjangkau masyarakat rentan?",
    buktiDukung: "PDF SK Inovasi, Proposal Ringkas/SOP Inovasi, dan foto/dokumentasi pelaksanaan.",
    opsi: [
      "Tidak memiliki program inovasi pelayanan.",
      "Memiliki ide/konsep inovasi namun belum ditetapkan dan belum dijalankan.",
      "Memiliki minimal 1 inovasi pelayanan yang telah ditetapkan melalui SK Kepala Unit dan sedang berjalan.",
      "Memiliki inovasi pelayanan yang berjalan aktif, memiliki SOP/pedoman pelaksanaan, dan memberikan kemudahan nyata bagi pengguna layanan.",
      "Memenuhi skor 3, inovasi bersifat kreatif/berdampak tinggi, telah berjalan minimal 6 bulan, dan dipublikasikan melalui media massa/media sosial."
    ]
  },
  {
    code: "6.2",
    aspekId: 6,
    judul: "Dampak dan Keberlanjutan Inovasi",
    pertanyaan: "Sejauh mana inovasi tersebut dievaluasi dan memberikan dampak positif bagi masyarakat?",
    buktiDukung: "PDF Laporan Evaluasi Inovasi, data rekap penerima manfaat, dan dokumentasi testimoni masyarakat.",
    opsi: [
      "Tidak ada data pemanfaatan inovasi.",
      "Inovasi berjalan namun belum ada pencatatan jumlah penerima manfaat.",
      "Terdapat daftar hadir/rekapitulasi jumlah masyarakat pengguna layanan inovasi.",
      "Terdapat laporan evaluasi inovasi yang menunjukkan peningkatan efisiensi layanan (waktu lebih cepat/cakupan lebih luas).",
      "Memenuhi skor 3, dilengkapi testimoni kepuasan masyarakat terhadap inovasi tersebut dan rencana pengembangan inovasi ke tahap berikutnya."
    ]
  },

  // --- ASPEK 7: SURVEI MASYARAKAT & ANTI-KORUPSI (Bobot: 15%) ---
  {
    code: "7.1",
    aspekId: 7,
    judul: "Pelaksanaan Survei Kepuasan Masyarakat (SKM) & Tindak Lanjut",
    pertanyaan: "Bagaimana pelaksanaan Survei Kepuasan Masyarakat (SKM) dan tindak lanjut atas hasilnya di unit kerja Anda?",
    buktiDukung: "Foto QR Code/alat survei di loket, Poster Publikasi IKM, dan PDF Laporan SKM beserta Rencana Tindak Lanjut (RTL).",
    opsi: [
      "Belum pernah melaksanakan SKM.",
      "Ada instrumen SKM (kertas/digital), namun belum direkap secara berkala.",
      "Melaksanakan SKM dan membuat laporan berkala (minimal per semester/triwulan).",
      "Laporan SKM lengkap dengan nilai IKM (Indeks Kepuasan Masyarakat) dan dipublikasikan di ruang layanan serta media sosial.",
      "Memenuhi skor 3, ditambah adanya dokumen Rencana Tindak Lanjut (RTL) dan bukti perbaikan nyata atas unsur layanan yang nilainya paling rendah."
    ]
  },
  {
    code: "7.2",
    aspekId: 7,
    judul: "Pelaksanaan Survei Persepsi Anti Korupsi (SPAK)",
    pertanyaan: "Bagaimana pelaksanaan pengukuran persepsi masyarakat terkait layanan bebas pungli, calo, dan diskriminasi (SPAK)?",
    buktiDukung: "PDF Laporan hasil SPAK dan foto/screenshot publikasi indeks SPAK di ruang layanan/medsos.",
    opsi: [
      "Belum melaksanakan survei persepsi anti-korupsi.",
      "Instrumen survei tersedia tetapi belum diolah menjadi laporan.",
      "Memiliki laporan hasil SPAK berkala.",
      "Laporan SPAK dipublikasikan secara terbuka di ruang pelayanan dan media sosial unit kerja.",
      "Nilai indeks SPAK kategori Sangat Baik (Bebas Korupsi) dan terdapat dokumen evaluasi rutin terhadap potensi kerawanan pungli/diskriminasi layanan."
    ]
  },
  {
    code: "7.3",
    aspekId: 7,
    judul: "Transparansi Biaya (Rp0 / PNBP) & Kampanye Anti-Gratifikasi",
    pertanyaan: "Sejauh mana kejelasan informasi tarif resmi layanan dan kampanye penolakan gratifikasi di area pelayanan?",
    buktiDukung: "Kolase foto ruang layanan yang menampilkan poster tarif resmi (Rp0/PNBP) dan stiker/banner Tolak Gratifikasi di loket & medsos.",
    opsi: [
      "Tidak ada informasi biaya layanan di ruang publik.",
      "Ada informasi biaya, namun kurang terlihat jelas oleh pemohon.",
      "Terpasang banner/poster daftar tarif layanan resmi (Rp0 / PNBP resmi) dengan jelas di ruang tunggu.",
      "Terpasang informasi tarif resmi DAN kampanye visual \"Tolak Gratifikasi / No Tipping / Layanan Bebas Pungli\" di meja petugas dan ruang tunggu.",
      "Memenuhi skor 3, ditambah kampanye aktif anti-gratifikasi di media sosial resmi unit kerja serta pencantuman nomor pelaporan khusus jika ditemukan pelanggaran."
    ]
  },
  {
    code: "7.4",
    aspekId: 7,
    judul: "Mitigasi Risiko & Pengendalian Gratifikasi Internal",
    pertanyaan: "Bagaimana kesiapan internal unit kerja dalam mencegah benturan kepentingan dan mengendalikan potensi gratifikasi?",
    buktiDukung: "PDF Pakta Integritas pegawai, Dokumen Pemetaan Risiko Gratifikasi/Benturan Kepentingan, dan Buku Register Pelaporan Gratifikasi (atau laporan nihil).",
    opsi: [
      "Belum ada komitmen atau aturan internal terkait pengendalian gratifikasi.",
      "Ada Pakta Integritas pegawai, namun belum ada mekanisme pengendalian gratifikasi.",
      "Seluruh pegawai menandatangani Pakta Integritas dan terdapat komitmen tertulis penolakan gratifikasi.",
      "Sudah dilakukan pemetaan titik rawan gratifikasi/benturan kepentingan pada layanan utama (misal: layanan pencatatan nikah luar kantor atau PPDB/mutasi siswa).",
      "Memenuhi skor 3, serta memiliki catatan/buku register pelaporan penolakan gratifikasi berkala (meskipun laporan nihil) dan sosialisasi internal rutin."
    ]
  },

  // --- ASPEK 8: VIDEO PRAKTIK PELAYANAN (Bobot: 20%) ---
  {
    code: "8.1",
    aspekId: 8,
    judul: "Kesesuaian Alur Layanan dan Transparansi Informasi dalam Video",
    pertanyaan: "Apakah alur pelayanan yang ditampilkan dalam video sesuai dengan Standar Pelayanan dan memperlihatkan transparansi informasi?",
    buktiDukung: "Tautan Video Praktik Pelayanan (YouTube / Google Drive) durasi 3-5 menit.",
    opsi: [
      "Tidak mengunggah video atau tautan rusak/tidak bisa diakses.",
      "Video hanya berisi slideshow foto tanpa memperlihatkan proses pelayanan aktif.",
      "Menampilkan proses pelayanan, namun alurnya tidak runtut dari awal hingga akhir.",
      "Menampilkan alur pelayanan secara utuh dan runtut (kedatangan, antrean, verifikasi berkas, pemrosesan, penyerahan produk layanan).",
      "Memenuhi skor 3, serta di dalam video terlihat jelas petugas menyampaikan informasi persyaratan, estimasi waktu, dan menegaskan kejelasan biaya (Gratis Rp0 atau mekanisme resmi PNBP)."
    ]
  },
  {
    code: "8.2",
    aspekId: 8,
    judul: "Penerapan Budaya Pelayanan Prima (5S & Hospitality / Inklusivitas)",
    pertanyaan: "Bagaimana sikap, etika, komunikasi, dan keramahan petugas yang terlihat di dalam video?",
    buktiDukung: "Observasi visual dari Video Praktik Pelayanan.",
    opsi: [
      "Tidak ada interaksi petugas yang ditampilkan.",
      "Petugas terlihat kaku, kurang ramah, dan tidak mengenakan atribut lengkap.",
      "Petugas mengenakan atribut lengkap dan melayani dengan standar biasa.",
      "Petugas menerapkan budaya 5S (Senyum, Sapa, Salam, Sopan, Santun) secara natural, menyambut saat pemohon datang, kontak mata baik, dan bahasa tubuh profesional.",
      "Memenuhi skor 3, ditambah adanya peragaan pelayanan inklusif (cara petugas membantu lansia/difabel/kelompok rentan dengan empati dan ramah) saat melayani."
    ]
  },
  {
    code: "8.3",
    aspekId: 8,
    judul: "Praktik Penolakan Gratifikasi dan Pengisian Survei di Akhir Layanan",
    pertanyaan: "Apakah video menampilkan edukasi penolakan gratifikasi dan pengisian survei kepuasan oleh pemohon di akhir layanan?",
    buktiDukung: "Observasi visual bagian penutup dari Video Praktik Pelayanan.",
    opsi: [
      "Video berhenti begitu saja tanpa penutup layanan.",
      "Hanya menampilkan penyerahan dokumen selesai.",
      "Petugas mengarahkan pemohon untuk mengisi survei kepuasan (SKM) di akhir layanan.",
      "Menampilkan pemohon memindai (scan) QR Code SKM/SPAK ATAU adegan petugas menolak pemberian imbalan/uang tip/bingkisan dengan sopan.",
      "Menampilkan keduanya secara jelas dan edukatif: petugas menolak gratifikasi dengan sopan (sambil menunjuk tanda Tolak Gratifikasi/Layanan Bebas Biaya) DAN pemohon memindai QR Code survei kepuasan sebelum meninggalkan loket."
    ]
  }
];
