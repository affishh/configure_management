pipeline {
    agent any

    environment {
        // Docker image name and tag
        IMAGE_NAME = 'myapp'
        IMAGE_TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Find Dockerfile directory (if you have multiple)
                    def dockerfileDir = sh(script: "find . -type f -name Dockerfile -exec dirname {} \\; | head -n 1", returnStdout: true).trim()
                    echo "Found Dockerfile in: ${dockerfileDir}"

                    // Build Docker image
                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ${dockerfileDir}"
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Assuming Node.js app; adjust if needed
                    sh "npm install"
                    sh "npm test"
                }
            }
        }

        stage('Push Image') {
            steps {
                script {
                    // Docker Hub credentials stored in Jenkins (Credentials ID: dockerhub-cred)
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        
                        // Login to Docker Hub
                        sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                        
                        // Tag the image correctly
                        sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} $DOCKER_USER/${IMAGE_NAME}:${IMAGE_TAG}"
                        
                        // Push to Docker Hub
                        sh "docker push $DOCKER_USER/${IMAGE_NAME}:${IMAGE_TAG}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh "docker logout"
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
