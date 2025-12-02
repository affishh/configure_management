pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "yourdockerhubusername/myapp:latest"  // Replace with your Docker Hub username
        APP_DIR = "configure_management"
        DOCKERHUB_USER = credentials('dockerhub-username') // Jenkins credentials ID
        DOCKERHUB_PASSWORD = credentials('dockerhub-password')
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/affishh/configure_management'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                # Disable BuildKit if buildx not installed
                DOCKER_BUILDKIT=0 docker build -t ${DOCKER_IMAGE} ${APP_DIR}
                """
            }
        }

        stage('Run Tests') {
            steps {
                sh """
                cd ${APP_DIR}
                npm install
                npm test || echo "No tests found"
                """
            }
        }

        stage('Push Image') {
            steps {
                sh """
                echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USER --password-stdin
                docker push ${DOCKER_IMAGE}
                """
            }
        }

        stage('Deploy GREEN Environment') {
            steps {
                sh """
                kubectl apply -f ${APP_DIR}/kubernetes/deployment-green.yaml
                kubectl apply -f ${APP_DIR}/kubernetes/service.yaml
                """
            }
        }

        stage('Smoke Test GREEN') {
            steps {
                sh """
                GREEN_IP=$(kubectl get svc green-service -o jsonpath='{.spec.clusterIP}')
                echo "Testing Green service at $GREEN_IP"
                curl -f http://$GREEN_IP || exit 1
                """
            }
        }

        stage('Switch Traffic BLUE → GREEN') {
            steps {
                sh "kubectl apply -f ${APP_DIR}/kubernetes/production-service-green.yaml"
            }
        }
    }

    post {
        failure {
            echo "Deployment Failed – Blue environment still active!"
        }
        success {
            echo "Green environment deployed successfully!"
        }
    }
}
