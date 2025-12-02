pipeline {
    agent any

    environment {
        IMAGE_NAME = 'myapp'
        IMAGE_TAG = 'latest'
        DOCKER_USER = 'afrin898'   // FIX: Make docker username available in all stages
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
                    // Find folder containing dockerfile
                    def dockerfileDir = sh(
                        script: "find . -type f -name Dockerfile -exec dirname {} \\; | head -n 1",
                        returnStdout: true
                    ).trim()

                    echo "Dockerfile found in: ${dockerfileDir}"

                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ${dockerfileDir}"
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    sh "npm install"
                    sh "npm test"
                }
            }
        }

        stage('Push Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', 
                        usernameVariable: 'USER', passwordVariable: 'PASS')]) {

                        sh "echo $PASS | docker login -u $USER --password-stdin"

                        sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Deploy Green') {
            steps {
                script {
                    echo "Deploying GREEN container..."

                    // Stop old green if exists
                    sh "docker rm -f myapp-green || true"

                    // Start NEW version as GREEN
                    sh "docker run -d --name myapp-green -p 4000:80 ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Test Green') {
            steps {
                script {
                    echo "Performing health check on GREEN..."

                    sh "sleep 3"  // give container time to start
                    sh "curl -f http://localhost:4000 || exit 1"
                }
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                script {
                    echo "Switching traffic to GREEN..."

                    // Stop old BLUE
                    sh "docker rm -f myapp-blue || true"

                    // GREEN becomes BLUE
                    sh "docker rename myapp-green myapp-blue"

                    echo "Blue-Green deployment complete!"
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up..."
            sh "docker logout || true"
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed — check logs!"
        }
    }
}
