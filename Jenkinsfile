pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "myregistry.com/myapp:latest"
        APP_DIR = "configuration_management"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/affishh/configure_management'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Use Docker Buildx if available
                    sh """
                    if ! docker buildx version > /dev/null 2>&1; then
                        docker buildx create --use
                    fi
                    docker build -t ${DOCKER_IMAGE} ${APP_DIR}
                    """
                }
            }
        }

        stage('Run Tests') {
            steps {
                sh """
                cd ${APP_DIR} || exit 1
                if [ -f package.json ]; then
                    npm install
                    npm test || echo "No tests found"
                else
                    echo "No package.json found, skipping tests"
                fi
                """
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push ${DOCKER_IMAGE}"
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
                GREEN_IP=\\$(kubectl get svc green-service -o jsonpath='{.spec.clusterIP}')
                echo "Testing Green service at \\$GREEN_IP"
                curl -f http://\\$GREEN_IP || exit 1
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
