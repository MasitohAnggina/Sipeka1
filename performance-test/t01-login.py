from locust import HttpUser, task, between

class LoginUser(HttpUser):

    host = "http://localhost:8000"

    wait_time = between(1, 3)

    @task
    def login(self):

        payload = {
            "email": "caca@gmail.com",
            "password": "caca123"
        }

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        with self.client.post(
            "/api/login",
            json=payload,
            headers=headers,
            name="Login",
            catch_response=True
        ) as response:

            if response.status_code == 200:
                print("Login berhasil")
                response.success()

            else:
                print("Status :", response.status_code)
                print("Response :", response.text)
                response.failure(
                    f"Gagal Login ({response.status_code})"
                )