pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "myregistry.com"
        APP_NAME = "myapp"
        BLUE_CONTAINER = "blue-${APP_NAME}"
        GREEN_CONTAINER = "green-${APP_NAME}"
        IMAGE_TAG = "latest"
        NODEAPP_DIR = "nodeapp" // folder containing Dockerfile
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                    # Ensure Buildx is available
                    docker buildx create --use || true
                    docker buildx build --platform linux/amd64 -t ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG} ${NODEAPP_DIR}
                    """
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    sh """
                    docker run --rm ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG} npm test || exit 1
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                    echo $DOCKER_PASS | docker login ${DOCKER_REGISTRY} -u $DOCKER_USER --password-stdin
                    docker push ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Deploy GREEN Environment') {
            steps {
                script {
                    sh """
                    # Remove previous green container if exists
                    docker rm -f ${GREEN_CONTAINER} || true
                    # Run new green container
                    docker run -d --name ${GREEN_CONTAINER} -p 8081:3000 ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Smoke Test GREEN') {
            steps {
                script {
                    sh """
                    for i in {1..5}; do
                        curl -s -f http://localhost:8081/ && exit 0 || sleep 5
                    done
                    exit 1
                    """
                }
            }
        }

        stage('Switch Traffic BLUE → GREEN') {
            steps {
                script {
                    sh """
                    # Stop old blue container
                    docker stop ${BLUE_CONTAINER} || true
                    # Rename green → blue
                    docker rename ${GREEN_CONTAINER} ${BLUE_CONTAINER}
                    # Run blue container on production port
                    docker run -d --name ${BLUE_CONTAINER} -p 8080:3000 ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful – Blue environment updated!"
        }
        failure {
            echo "Deployment failed – rolling back to previous Blue environment"
            sh """
            docker stop ${GREEN_CONTAINER} || true
            docker start ${BLUE_CONTAINER} || true
            """
        }
    }
}
