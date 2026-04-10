import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ১. আপনার Firebase কনফিগ

const firebaseConfig = {
  apiKey: "AIzaSyBUwnDpxPZGWyIEptucvP5yf7O-81Oa33Y",
  authDomain: "blood-donor-16639.firebaseapp.com",
  projectId: "blood-donor-16639",
  storageBucket: "blood-donor-16639.firebasestorage.app",
  messagingSenderId: "751470171517",
  appId: "1:751470171517:web:1d0b70e4ab3b5b00de6814",
  measurementId: "G-MLNLV4DGKY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ২. ডিলিট করার ফাংশন (এটি সবার উপরে রাখুন যেন সহজে খুঁজে পায়)
window.deleteDonor = async (docId) => {
    if (confirm("আপনি কি নিশ্চিতভাবে এই তথ্যটি ডিলিট করতে চান?")) {
        try {
            await deleteDoc(doc(db, "donors", docId));
            alert("সফলভাবে ডিলিট করা হয়েছে।");
            fetchDonors(); // ডাটা আপডেট করার জন্য আবার কল করা হলো
        } catch (error) {
            alert("ডিলিট করতে সমস্যা হয়েছে: " + error.message);
        }
    }
};

// ৩. থ্রি-ডট মেনু টগল করার ফাংশন
window.toggleMenu = (id) => {
    const menu = document.getElementById('menu-' + id);
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        // অন্য সব খোলা মেনু বন্ধ করে শুধু এটি ওপেন করবে
        document.querySelectorAll('.delete-menu').forEach(m => m.style.display = 'none');
        menu.style.display = 'block';
    }
};

// ৪. ইউজার স্টেট চেক (লগইন থাকলে ফর্ম দেখাবে)
onAuthStateChanged(auth, (user) => {
    const authBox = document.getElementById('authBox');
    const donorFormBox = document.getElementById('donorFormBox');
    if (user) {
        if(authBox) authBox.style.display = 'none';
        if(donorFormBox) donorFormBox.style.display = 'block';
    } else {
        if(authBox) authBox.style.display = 'block';
        if(donorFormBox) donorFormBox.style.display = 'none';
    }
    fetchDonors();
});

// ৫. দাতা তথ্য লোড করা এবং সার্চ করা
window.fetchDonors = async () => {
    const container = document.getElementById('donorContainer');
    if (!container) return;

    const searchLoc = document.getElementById('locSearch')?.value.toLowerCase() || "";
    const searchBlood = document.getElementById('bloodSearch')?.value || "";

    const querySnapshot = await getDocs(collection(db, "donors"));
    container.innerHTML = "";
    const user = auth.currentUser;

    querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const id = docSnap.id;

        // ফিল্টারিং লজিক
        const matchLoc = !searchLoc || d.address.toLowerCase().includes(searchLoc);
        const matchBlood = !searchBlood || d.blood === searchBlood;

        if (matchLoc && matchBlood) {
            const card = document.createElement('div');
            card.className = "donor-card";

            // ডিলিট মেনু লজিক: শুধু নিজের তথ্যে ডিলিট অপশন দেখাবে
            let menuHTML = "";
            if (user && d.uid === user.uid) {
                menuHTML = `
                    <div class="menu-btn" onclick="toggleMenu('${id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                    <div class="delete-menu" id="menu-${id}" style="display:none;">
                        <button onclick="deleteDonor('${id}')">Delete</button>
                    </div>
                `;
            }

            card.innerHTML = `
                ${menuHTML}
                <div class="blood-badge">${d.blood}</div>
                <h3>${d.name}</h3>
                <p>📍 ${d.address}</p>
                <a href="tel:${d.phone}" style="color:red; text-decoration:none; font-weight:700; display:inline-block; margin-top:15px;">📞 কল করুন</a>
            `;
            container.appendChild(card);
        }
    });
};

// ৬. লগইন/সাইনআপ বাটন এবং টগল লজিক
const toggleText = document.getElementById('toggleText');
if(toggleText){
    toggleText.onclick = () => {
        const title = document.getElementById('authTitle');
        const btn = document.getElementById('authBtn');
        if(title.innerText === "লগইন করুন"){
            title.innerText = "নতুন অ্যাকাউন্ট"; btn.innerText = "সাইন আপ";
            toggleText.innerText = "আগের অ্যাকাউন্ট আছে? লগইন করুন";
        } else {
            title.innerText = "লগইন করুন"; btn.innerText = "প্রবেশ করুন";
            toggleText.innerText = "নতুন অ্যাকাউন্ট তৈরি করুন";
        }
    };
}

const authBtn = document.getElementById('authBtn');
if(authBtn){
    authBtn.onclick = async () => {
        const email = document.getElementById('email').value.trim();
        const pass = document.getElementById('password').value.trim();
        if(!email || !pass) return alert("সব তথ্য দিন");
        try {
            if(authBtn.innerText === "প্রবেশ করুন") await signInWithEmailAndPassword(auth, email, pass);
            else await createUserWithEmailAndPassword(auth, email, pass);
            alert("সফল হয়েছে!");
        } catch(e) { alert("সমস্যা: " + e.message); }
    };
}

// ৭. তথ্য জমার লজিক
const bloodForm = document.getElementById('bloodForm');
if(bloodForm){
    bloodForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "donors"), {
                name: document.getElementById('dName').value,
                address: document.getElementById('dAddress').value,
                blood: document.getElementById('dBlood').value,
                phone: document.getElementById('dPhone').value,
                uid: auth.currentUser.uid
            });
            alert("আপনার তথ্য জমা হয়েছে!");
            location.href = "index.html"; // হোমে পাঠিয়ে দিবে
        } catch(e) { alert("Error: " + e.message); }
    };
}

// ৮. লগআউট
window.logoutUser = () => {
    signOut(auth).then(() => {
        alert("লগআউট করা হয়েছে।");
        location.reload();
    });
};