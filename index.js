const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

app.post("/drive", async (req, res) => {
  console.log("🚀 Requête POST /drive reçue");

  const { produits, email, password } = req.body;

  if (!produits || !email || !password) {
    return res.status(400).send("Champs manquants : produits, email, password");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://www.carrefour.fr/mon-compte/connexion", { waitUntil: "networkidle2" });

    await page.type("#login-email", email);
    await page.type("#login-password", password);
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    for (const produit of produits) {
      console.log(`🛒 Recherche : ${produit}`);
      await page.goto("https://www.carrefour.fr", { waitUntil: "networkidle2" });
      await page.type("input[type='search']", produit);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(3000);

      const boutons = await page.$x("//button[contains(., 'Ajouter au panier')]");
      if (boutons.length > 0) {
        await boutons[0].click();
        await page.waitForTimeout(1000);
      } else {
        console.log(`❌ Produit introuvable : ${produit}`);
      }
    }

    res.send("✅ Produits ajoutés avec succès au panier Carrefour.");
  } catch (err) {
    console.error("💥 Erreur : ", err);
    res.status(500).send("Erreur lors de l’ajout des produits.");
  } finally {
    await browser.close();
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Serveur Puppeteer en ligne sur le port 3000");
});
