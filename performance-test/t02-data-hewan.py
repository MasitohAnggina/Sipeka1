from locust import HttpUser, task, between

class DataHewanUser(HttpUser):

    host = "http://localhost:8000"
    wait_time = between(1, 3)

    def on_start(self):
        payload = {
            "email": "caca@gmail.com",
            "password": "caca123"
        }

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        response = self.client.post(
            "/api/login",
            json=payload,
            headers=headers,
            name="Login"
        )

        if response.status_code == 200:
            token = response.json()["token"]

            self.headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }

            print("Login berhasil")

        else:
            print("Login gagal")
            print(response.text)
            self.headers = {}

    @task
    def crud_data_hewan(self):

        # ==========================
        # Tambah Data Hewan
        # ==========================

        payload = {
            "nama_hewan": "Locust",
            "jenis": "Kucing",
            "ras": "Persia",
            "umur": 2,
            "berat": 3
        }

        response = self.client.post(
            "/api/owner_pet/data_hewan",
            json=payload,
            headers=self.headers,
            name="Tambah Data Hewan"
        )

        if response.status_code != 201:
            print("Tambah gagal")
            print(response.text)
            return

        id_hewan = response.json()["data"]["id_hewan"]

        # ==========================
        # Lihat Data Hewan
        # ==========================

        response = self.client.get(
            "/api/owner_pet/data_hewan",
            headers=self.headers,
            name="Lihat Data Hewan"
        )

        if response.status_code != 200:
            print("Lihat gagal")

        # ==========================
        # Edit Data Hewan
        # ==========================

        payload_update = {
            "nama_hewan": "Locust Update",
            "jenis": "Kucing",
            "ras": "Anggora",
            "umur": 3,
            "berat": 4
        }

        response = self.client.put(
            f"/api/owner_pet/data_hewan/{id_hewan}",
            json=payload_update,
            headers=self.headers,
            name="Edit Data Hewan"
        )

        if response.status_code != 200:
            print("Edit gagal")
            print(response.text)

        # ==========================
        # Hapus Data Hewan
        # ==========================

        response = self.client.delete(
            f"/api/owner_pet/data_hewan/{id_hewan}",
            headers=self.headers,
            name="Hapus Data Hewan"
        )

        if response.status_code != 200:
            print("Hapus gagal")
            print(response.text)