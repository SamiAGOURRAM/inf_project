# Script de Test de Concurrence - INF Platform
# Test la robustesse du système de booking face à des requêtes simultanées
# Objectif : Vérifier que seulement 2 étudiants peuvent booker un slot (capacity = 2)

import asyncio
import time
from datetime import datetime
from typing import List, Dict, Any
import json

# Configuration
SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY = "YOUR_ANON_KEY"

# Nombre d'utilisateurs simulés (doit être > capacity du slot)
NUM_CONCURRENT_USERS = 100

# ID du slot à tester (à récupérer depuis votre DB)
TEST_SLOT_ID = "YOUR_SLOT_ID"

# Tokens JWT de différents étudiants (à générer au préalable)
# Pour ce test, vous devez créer plusieurs comptes étudiants et récupérer leurs tokens
USER_TOKENS = [
    # Ajoutez ici les tokens JWT de vos utilisateurs de test
    # "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
]


class BookingTester:
    def __init__(self, supabase_url: str, anon_key: str):
        self.supabase_url = supabase_url
        self.anon_key = anon_key
        self.results = []
        
    async def book_slot(self, user_token: str, slot_id: str) -> Dict[str, Any]:
        """
        Simule une tentative de booking pour un utilisateur
        """
        import aiohttp
        
        start_time = time.time()
        
        headers = {
            "apikey": self.anon_key,
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "slot_id_to_book": slot_id
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.supabase_url}/rest/v1/rpc/fn_book_interview"
                async with session.post(url, headers=headers, json=payload) as response:
                    end_time = time.time()
                    response_time_ms = int((end_time - start_time) * 1000)
                    
                    data = await response.json()
                    
                    return {
                        "success": data.get("success", False),
                        "message": data.get("message", ""),
                        "error_code": data.get("error_code", None),
                        "response_time_ms": response_time_ms,
                        "status_code": response.status
                    }
        except Exception as e:
            end_time = time.time()
            return {
                "success": False,
                "message": str(e),
                "error_code": "EXCEPTION",
                "response_time_ms": int((end_time - start_time) * 1000),
                "status_code": None
            }
    
    async def run_concurrent_test(self, slot_id: str, user_tokens: List[str]):
        """
        Lance des tentatives de booking simultanées
        """
        print(f"\n{'='*80}")
        print(f"🧪 TEST DE CONCURRENCE - INF Platform")
        print(f"{'='*80}")
        print(f"📅 Date : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Slot testé : {slot_id}")
        print(f"👥 Nombre d'utilisateurs : {len(user_tokens)}")
        print(f"⚡ Mode : Bookings simultanés (race condition test)")
        print(f"{'='*80}\n")
        
        # Créer les tâches pour tous les utilisateurs
        tasks = [
            self.book_slot(token, slot_id)
            for token in user_tokens
        ]
        
        print(f"⏳ Lancement de {len(tasks)} tentatives simultanées...\n")
        
        # Lancer toutes les requêtes EN MÊME TEMPS
        start_time = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        total_duration = end_time - start_time
        
        # Analyser les résultats
        successful = [r for r in results if isinstance(r, dict) and r.get("success")]
        failed = [r for r in results if isinstance(r, dict) and not r.get("success")]
        exceptions = [r for r in results if not isinstance(r, dict)]
        
        # Grouper les erreurs par code
        error_distribution = {}
        for result in failed:
            error_code = result.get("error_code", "UNKNOWN")
            error_distribution[error_code] = error_distribution.get(error_code, 0) + 1
        
        # Calculer les temps de réponse
        response_times = [r.get("response_time_ms", 0) for r in results if isinstance(r, dict)]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        max_response_time = max(response_times) if response_times else 0
        min_response_time = min(response_times) if response_times else 0
        
        # Afficher les résultats
        print(f"\n{'='*80}")
        print(f"📊 RÉSULTATS DU TEST")
        print(f"{'='*80}\n")
        
        print(f"⏱️  Durée totale du test : {total_duration:.2f}s")
        print(f"⚡ Temps de réponse moyen : {avg_response_time:.0f}ms")
        print(f"📈 Temps de réponse max : {max_response_time:.0f}ms")
        print(f"📉 Temps de réponse min : {min_response_time:.0f}ms\n")
        
        print(f"✅ Réservations RÉUSSIES : {len(successful)}")
        print(f"❌ Réservations ÉCHOUÉES : {len(failed)}")
        print(f"⚠️  Exceptions : {len(exceptions)}\n")
        
        if error_distribution:
            print(f"📋 Distribution des erreurs :")
            for error_code, count in sorted(error_distribution.items(), key=lambda x: -x[1]):
                print(f"   • {error_code}: {count}")
            print()
        
        # Verdict
        print(f"{'='*80}")
        print(f"🎯 VERDICT")
        print(f"{'='*80}\n")
        
        EXPECTED_SUCCESSES = 2  # Capacity du slot
        
        if len(successful) == EXPECTED_SUCCESSES:
            print(f"✅ TEST RÉUSSI !")
            print(f"   Exactement {EXPECTED_SUCCESSES} réservations ont été acceptées.")
            print(f"   Le système a correctement géré la concurrence.\n")
        elif len(successful) < EXPECTED_SUCCESSES:
            print(f"⚠️  TEST PARTIEL")
            print(f"   Seulement {len(successful)}/{EXPECTED_SUCCESSES} réservations réussies.")
            print(f"   Le slot n'est pas rempli alors qu'il y avait assez de demandes.\n")
        else:
            print(f"❌ TEST ÉCHOUÉ !")
            print(f"   {len(successful)} réservations acceptées au lieu de {EXPECTED_SUCCESSES}.")
            print(f"   RACE CONDITION DÉTECTÉE : Le slot est surréservé !\n")
        
        # Vérifier les erreurs attendues
        expected_errors = ["SLOT_FULL", "ALREADY_BOOKED"]
        most_common_error = max(error_distribution.items(), key=lambda x: x[1])[0] if error_distribution else None
        
        if most_common_error in expected_errors:
            print(f"✅ Les échecs sont dus à '{most_common_error}' (comportement attendu)")
        elif most_common_error:
            print(f"⚠️  Erreur inattendue : '{most_common_error}'")
        
        print(f"\n{'='*80}\n")
        
        # Retourner les résultats pour analyse
        return {
            "total_attempts": len(user_tokens),
            "successful": len(successful),
            "failed": len(failed),
            "exceptions": len(exceptions),
            "error_distribution": error_distribution,
            "total_duration": total_duration,
            "avg_response_time": avg_response_time,
            "test_passed": len(successful) == EXPECTED_SUCCESSES
        }


async def main():
    """
    Point d'entrée du script
    """
    if not USER_TOKENS:
        print("❌ ERREUR : Aucun token utilisateur fourni.")
        print("\nPour exécuter ce test :")
        print("1. Créez plusieurs comptes étudiants sur la plateforme")
        print("2. Récupérez leurs tokens JWT (depuis le localStorage ou Supabase Auth)")
        print("3. Ajoutez-les à la liste USER_TOKENS dans ce script")
        return
    
    if len(USER_TOKENS) < 5:
        print(f"⚠️  ATTENTION : Seulement {len(USER_TOKENS)} utilisateurs configurés.")
        print("   Pour un test significatif, utilisez au moins 10-20 utilisateurs.")
    
    tester = BookingTester(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Lancer le test
    results = await tester.run_concurrent_test(TEST_SLOT_ID, USER_TOKENS)
    
    # Sauvegarder les résultats (optionnel)
    with open(f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"💾 Résultats sauvegardés dans test_results_*.json")


if __name__ == "__main__":
    # Installer les dépendances :
    # pip install aiohttp
    
    print("""
    ╔═══════════════════════════════════════════════════════════════════════╗
    ║                                                                       ║
    ║   TEST DE CONCURRENCE - INF PLATFORM                                  ║
    ║   Vérification de la robustesse du système de booking                ║
    ║                                                                       ║
    ╚═══════════════════════════════════════════════════════════════════════╝
    """)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrompu par l'utilisateur")
    except Exception as e:
        print(f"\n\n❌ ERREUR : {e}")
