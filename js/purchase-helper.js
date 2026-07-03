/* ============================================================
   SAVE PURCHASE AFTER PAYMENT
   Gebruik dit in je checkout flow
============================================================ */

async function savePurchaseToDatabase(purchaseData) {
    // Check of user ingelogd is
    if (localStorage.getItem('loggedIn') !== 'true') {
        console.error('User is niet ingelogd');
        return false;
    }
    
    try {
        const response = await fetch('includes/save-purchase.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(purchaseData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update localStorage
            const purchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');
            purchases.push(purchaseData);
            localStorage.setItem('userPurchases', JSON.stringify(purchases));
            
            // Update collections als het een collection is
            if (purchaseData.purchase_type === 'collection') {
                const collections = JSON.parse(localStorage.getItem('userCollections') || '[]');
                collections.push({
                    collection_id: purchaseData.item_id,
                    purchased_at: new Date().toISOString()
                });
                localStorage.setItem('userCollections', JSON.stringify(collections));
            }
        }
        
        return data.success;
        
    } catch (error) {
        console.error('Error saving purchase:', error);
        return false;
    }
}

// Maak beschikbaar voor andere scripts
window.savePurchaseToDatabase = savePurchaseToDatabase;
